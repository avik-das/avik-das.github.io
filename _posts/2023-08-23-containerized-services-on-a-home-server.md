---
title: "Containerized services on a home server"
layout: blog
cover-img: /assets/images/2023-08-23-containerized-services-on-a-home-server/network-architecture.svg
---

With my [mini PC server set up with Debian]({% post_url 2023-08-21-setting-up-a-micro-pc-as-a-linux-server %}), I prepared the server for actually running useful services. This time, I decided I would go all in with containers, hoping that will keep my applications self-contained enough that I don't have to think about different applications stepping on each other.

I don't claim to be an expert, and I've been piecing together this knowledge through many online resources. Like the last post, a lot of these are notes for myself.

One thing to note is I'm a very stubborn person, and a running theme is me doing things the non-standard way just on principle 😅

## Podman and Podman Compose

The first controversial decision is to use Podman instead of the industry-standard Docker. Podman attracted me because it doesn't use a daemon-based architecture, meaning individual containers will run under specific users, instead of a single daemon typically running as root. I could also say I was concerned about [Docker's approach to monetization](https://blog.alexellis.io/docker-is-deleting-open-source-images/), but Red Hat (makers of Podman) has [generated some controversy](https://arstechnica.com/information-technology/2023/06/red-hats-new-source-code-policy-and-the-intense-pushback-explained/) lately as well. Mostly, I like the daemon-less architecture and thought this would be a good time to play around with some new technology.

Installing Podman, and the associated Podman Compose for small-scale container orchestration, is easy:

```sh
sudo apt install podman podman-compose
```

Note that prior to Bookworm, the previous stable version of Debian had some pretty old versions of Podman and required [installing Podman Compose manually](https://github.com/containers/podman-compose#installation). Moreover, the old version of Podman meant you needed to install an older version of Compose from a branch. With Bookworm, I don't have this problem.

### Compatibility with Docker

With this setup, I can usually just use any `docker-compose.yml` file almost as-is. Instead of running `sudo docker-compose -f <filename.yml> up`, I just run `podman-compose -f <filename.yml> up`. Very convenient, thanks to the [Open Container Initiative](https://opencontainers.org/) creating industry-wide standards that multiple tools can leverage. But there are two major differences I need to think about when adapting instructions for Docker to use Podman:

- A lot of Docker Compose files use image names that are not prefixed with the hostname of any container registry. This is because Docker is configured to default to `docker.io`, the Docker company's official registry. I can configure Podman to do the same, but I like being explicit with my code and configuration. This means if an image is referenced without a registry hostname, I just have to prepend `docker.io/` to the name.

- At least as of Podman Compose 1.0.3, I found `.env` file handling not where I was expecting it to be. Generally, there are two ways these files are used, either to substitute values into the Compose file itself and to pass along environment variables into the running containers. Using the [`env_file` directive](https://docs.docker.com/compose/compose-file/05-services/#env_file), you can use a filename other than `.env`. However, I found that doing so prevent values from being substituted directly in the Compose file. For now, I'm making sure each service I want to configure has its own directory containing a default-name `.env` file when needed.

### Configuring inter-container networking

When trying to set up some more complex applications, I found that containers were not able to resolve each other by container name. In trying to fix this, I tried a bunch of solutions, only to find that I needed to reboot (or probably run some command, but rebooting did the trick). So, I don't know everything below is necessary, and it's worth trying just the first command to see if that's enough. Just remember to reboot!

First, install the `golang-github-containernetworking-plugin-dnsname` package. Theoretically, this should be enough, as it allows containers to DNS resolve each other by container name, as long as they are in the same virtual network:

```sh
sudo apt install golang-github-containernetworking-plugin-dnsname
```

But, when I was trying to figure out the networking prior to rebooting, I saw some errors that prompted me to do the following:

```sh
sudo apt install dbus-user-session
sudo systemctl --user start dbus
```

### Rootless logging

Another issue I encountered was errors around logging. This was especially relevant when I was trying to debug the inter-container networking issues I described above. I don't know too much about this, but it seems like the standard `journald`-based logging requires some extra permissions. The way I ended up fixing the issues was to switch to file-based logging for the user in question (I talk more about the user setup below). For example, when setting up [Immich](https://immich.app/), I updated the container config as follows:

```sh
sudo -u immich mkdir ~immich/.config/containers
sudo -u immich cp \
  /usr/share/containers/containers.conf \
  ~immich/.config/containers/containers.conf  # copy over the default config
sudoedit -u immich ~immich/.config/containers/containers.conf
```

In this configuration file, set:

```
events_logger = "file"
log_driver = "k8s-file"
```

It looks like I could have just [added the user in question to the `systemd-journal` group](https://serverfault.com/a/1011140). For now, I'm not bothering, but I'm willing to try it out the next time I encounter this problem.

EDIT (May 25, 2025): I tried adding a user to the `systemd-journal` group, and it worked! The original error I was getting when trying to run something like `podman logs` was:

```
Error: initial journal cursor: failed to get cursor: cannot assign requested address
```

Then, I ran, for one of my later services:

```sh
sudo usermod -a -G systemd-journal jitsi
```

After restarting the service, I was able to get the logs just fine. No need to  update the container config as described above.

## One user per service

Using Podman's rootless architecture, I decided that I'll run each service as a separate user. Additionally, I wanted these users to be _system users_. Unlike regular users, system users don't, by default, have a login shell, so they can't be logged into. They also don't show in a listing of login users, say in the login screen of a graphical installation. This latter point is moot for me because I didn't install a GUI. Again, I'm making these choices on principle.

First, I added a `services` group to make it easier to easily give common permissions to all the service users. By default, system users are placed in the `nogroup` group, so I wanted a shared group for these users.

```sh
sudo addgroup --system services
```

Next, I added the user. For example, when preparing to set up [Forgejo](https://forgejo.org/), I created a system user called `forgejo`. Two things to note are that I have to explicitly ask the user to be added to the `services` group, and I have to explicitly specify the home directory. By default, system users have their home directory set to `/nonexistent`, which doesn't exist and is not created by the `adduser` command. I was hoping to get away with no home directory, but unfortunately, Podman stores its data in the running user's home directory.

```sh
sudo adduser \
  --system \
  --comment 'Forgejo system user' \
  --home /home/forgejo \
  --ingroup services \
  forgejo

# The above command should output the user ID of the new user. But if you
# forget, you can check after the fact:
id forgejo  # in this case, the ID is 102
```

Next, I had set up subuids and subgids for the user. The way containers work is they [run processes and create files/directories under "virtual users"](https://www.funtoo.org/LXD/What_are_subuids_and_subgids%3F). This way, the container-specific processes and data don't clash with existing users on the system. To do this, subuids and subgids allow reserving a large range of user and group IDs for the parent user to allocate as needed.

```sh
# Check the current range of subuids/subgids
# Format is "username:startid:numids"
cat /etc/subuid
cat /etc/subgid

# Adjust the command to use the next available range
# Format is "startid-endid"
sudo usermod --add-subuids 1001000000-1001999999 forgejo
sudo usermod --add-subgids 1001000000-1001999999 forgejo

# Confirm the subuids/subgids were added
cat /etc/subuid
cat /etc/subgid
```

Finally, when running containers, I encountered errors related to the fact that the users running the containers were not logged in. The systemd login manager can start up a "user manager" for non-logged in users by enabling lingering:

```sh
# Use the user ID of the user
sudo loginctl enable-linger 102
```

Note that the home directory, the subuids/subgids and lingering would automatically be set up for non-system users. But again, on principle, these users _have_ to be system users!

## Systemd

With this setup, I can already start up a service using Podman Compose. For example, for Forgejo, I would run:

```sh
# Run as the forgejo user
# Run in daemon mode (in the background)
sudo -u forgejo podman-compose -f /path/to/forgejo-compose.yml up -d
```

In fact, I would do exactly this to test out the service works. But, because Podman doesn't use a global daemon, nothing exists to start up running containers after a system reboot (Docker supports this with the [`restart` directive](https://docs.docker.com/compose/compose-file/05-services/#restart)). Instead, I use systemd to manage the application as a service. I start by creating a service configuration file called `forgejo.service`. A few things to note about this service are:

- It runs as the `forgejo` user, under the `services` group and with the home directory as the working directory.
- All paths are absolute.
- By setting the dependency via the `After` and `Wants` directives, I ensure the service starts up on its own after a reboot, and that too at the right point in the system initialization.

```ini
[Unit]
Description=Forgejo self-hosted lightweight software forge
After=network.target
Wants=network.target

[Service]
Type=oneshot
RemainAfterExit=true
User=forgejo
Group=services
WorkingDirectory=/home/forgejo
ExecStart=/usr/bin/podman-compose -f /path/to/forgejo/forgejo.yml up -d
ExecStop= /usr/bin/podman-compose -f /path/to/forgejo/forgejo.yml down

[Install]
WantedBy=multi-user.target
```

I can install this service by placing the configuration file in the system-wide services directory, enabling the service and starting it up.

```sh
# Running this in /path/to/forgejo
sudo cp forgejo.service /etc/systemd/system/forgejo.service
sudo systemctl enable forgejo.service

sudo systemctl start forgejo.service
echo $?  # Confirm the service started up correctly
         # The return code should be 0
```

At this point, the service will start up automatically after a reboot. If I want to stop or restart the service myself, I can do that too:

```sh
sudo systemctl restart forgejo.service   
sudo systemctl stop forgejo.service  
```

Finally, the `start` and `restart` commands are a bit of a black box, and you don't get to see errors or other logs on the command line. Instead, you can use `journald` to view the logs. Unfortunately, this doesn't include all the logging, namely the part where the container images are downloaded. Given that this part can take a long time, I suggest running `podman-compose` manually to download the images before running it via systemd.

```sh
sudo journalctl -fxeu forgejo.service
```

All of this might seem like a disadvantage compared to Docker, but I prefer this system. I think it follows the Unix philosophy, letting Podman focus on containerization and systemd focus on service lifecycle.

## Reverse proxy

There has been a lot of setup, but we're almost done. The last part is making the service available on the internet, so I can access it when I'm not at home. I could definitely use a self-hosted VPN, and I might do that for some services in the future, but I want to share some of these services with other people.

The basic setup has a few parts:

1. I own some domains, so I use a subdomain for each service pointing to my home IP address.
1. My router is set up to forward specific ports to my server.
1. On the server, the [Caddy web server](https://caddyserver.com/) redirects to different internal ports based on the subdomain being accessed.

Here's the final architecture, which I'll describe in more detail below:

<figure>
  <img
    src="{{ page.cover-img }}"
    width="600"
    alt="Diagram of the architecture described above: the DNS provider uses an A record to point to my home router, which uses port forwarding to point to Caddy, which acts as a reverse proxy to my internal services">
</figure>

### Subdomains point to my home IP address

This part is pretty straightforward. I just log into my domain registrar's DNS settings and create a new subdomain, set up as an A record. Generally my IP address doesn't change frequently, but it is technically dynamic, so I want to automatically update the A record when my IP address changes. To do this, I use [DDclient](https://ddclient.net/).

The exact details of how to set up DDclient will depend on your DNS provider, but you should get a configuration dialog during installation or if you manually reconfigure:

```sh
sudo apt install ddclient

# To reconfigure later
sudo dpkg-reconfigure ddclient

# Or manually edit the configuration file
sudoedit /etc/ddclient.conf

# Don't forget to manually refresh
sudo ddclient
```

What I like to do is set up my subdomain to point to `0.0.0.0`, update the configuration to include the new subdomain and refresh. This way, I can verify the subdomain is going to update correctly if my IP address changes.

### Using Caddy as a reverse proxy

I want all the services on my server to be available over port 443, instead of having to specify the port when accessing most of the services. Additionally, I don't want to have individual containers bind to ports like 443, which would require the service users have additional privileges. The way to do this requires a few steps:

1. Configure my router to forward ports 80 and 443 to my server.

1. Use [Caddy](https://caddyserver.com/) with virtual domains as a reverse proxy to the services. Caddy is the only service on the system listening on ports 80 and 443. I like Caddy for this simple use case because, unlike Nginx, the configuration is simple and I don't have to separately configure Certbot to provision Let's Encrypt HTTPS certificates.

1. Ensure that services that expose ports only expose non-privileged ports, ones greater than 1024. For example, internally, a service might bind to port 80 inside the container but expose that to 3000. This is something I have to check in the Podman Compose configuration files, because a lot of times, they try to expose privileged ports. I also make sure to _not_ enable HTTPS for that service if that's an option.

After configuring my router's port forwarding and starting up a service on a non-privileged port, I installed Caddy:

```sh
sudo apt install caddy
```

Before configuring any specific services, I need to add some global configuration. Opening up `/etc/caddy/Caddyfile`, I commented out the default configuration and added the following:

```
{
    # Used primarily as the email to associate with Let's Encrypt certificates,
    # in case any communications are needed.
    email my_email@example.com
}
```

Now, I can add service-specific configuration, one block per service. Almost all the services are similar:

```
mysubdomain.mydomain.com {
    # Point to whatever port the internal service exposes
    reverse_proxy :3000
}
```

By default, since I don't specify a protocol (for example `http://`), Caddy defaults to HTTPS and provisions a Let's Encrypt certificate for this domain. This works automatically as long as port 80 on my router is being forwarded to this Caddy instance.

Now, I just restart Caddy and I'm good to go:

```sh
sudo systemctl restart caddy
```

Note that many services allow you to specify what hostname they will run on. This is typically configured as an environment variable or as part of a configuration file. Among other reasons, configuring the hostname is useful for display purposes within the application.

<figure markdown="1">
  ![The clone URL displayed for one of my git repos on my Forgejo instance, showing the hostname I configured](/assets/images/2023-08-23-containerized-services-on-a-home-server/forgejo-clone-url.png)
  <figcaption>The clone URL displayed for my git repos on my Forgejo instance shows the correct domain due to application-specific configuration</figcaption>
</figure>

## Tooling for managing services

Because I have to customize my application installations with details such as file paths, expose ports and user information, I created some tooling to manage these installations. The tooling is straightforward:

- Each service's configuration is stored in its own directory. The directory typically consists of the Podman Compose file, the systemd service file and optionally, a `.env` file.

- The parent directory for these services contains a script to copy over the systemd service file to the right place and a README with useful commands. All of this serves as a reminder for myself how to install and manage these services.

- These files are managed using git and stored on my Forgejo instance. Meta!

I'm not sharing the repo because I don't want to share all the specific details of my server setup, like file paths and hostnames.

---

With these steps, I'm happy with how isolated each service is, how it automatically starts up with the machine and how little extra maintenance is needed once I get a service running. Even getting the service installed in the first place is easy thanks to containerization. I installed two services recently in just a few minutes.

Nothing about these steps are revolutionary, as they use off-the-shelf tools combined together exactly as they are meant to be. Having this documented here hopefully helps others understand the larger ecosystem of tools and how they can be put together to spin up a useful, low-maintenance home server.
