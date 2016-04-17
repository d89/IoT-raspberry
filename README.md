# IoT-raspberry
Home control client unit that works together with [IoT Server](https://github.com/d89/IoT-server).

## Raspi Config

```
raspi-config
1 -> Expand Filesystem
5 -> Internationalisation Options -> Change Locale (z.B. de_DE.UTF-8 UTF-8" -> "C.UTF-8"), Change Timezone (z.B. Europe -> Berlin)
6 -> Enable Camera
9 -> Advanced Options -> A4: SSH, A5: Device Tree, A6: SPI, A7: I2C
Finish & Reboot
```

## Change keyboard layout

```
nano /etc/default/keyboard
```

Change ```XKBLAYOUT``` to whatever country code you need. save & ```reboot```

```
XKBLAYOUT="de"
```

## Establish a wifi connection using a static ip

**Fully optional and only necessary when you want to have a static address and wifi.**

Since debian jessie, most of the guides you will find in the internet are obsolete as ```dhcpcd``` and ```wpa_supplicant``` is used. No more ```/etc/network/interfaces```. Use https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md and http://www.amazon.de/EDIMAX-EW-7811UN-Wireless-Adapter-IEEE802-11b/dp/B003MTTJOY

***wifi connection***

```
nano /etc/wpa_supplicant/wpa_supplicant.conf

Add to file (on bottom):

network={
   ssid="your_ssid"
   psk="your_password"
}
```

***static ip***

```
nano /etc/dhcpcd.conf

Add to file (on bottom):

interface wlan0
   static ip_address=192.168.0.70/24
   static routers=192.168.0.1
   static domain_name_servers=192.168.0.1

reboot
```

## Firmware Update

```
apt-get update
apt-get upgrade
wget https://raw.githubusercontent.com/Hexxeh/rpi-update/master/rpi-update -O /usr/bin/rpi-update
chmod +x /usr/bin/rpi-update
rpi-update
reboot now
```

## Essentials

Don't skip this! These tools are basically necessary for everything else later on.

```
apt-get update
apt-get install -y build-essential git gpac mpg321 omxplayer python-dev libboost-python-dev python-pip python-smbus i2c-tools
```

## Node 5 (or above)

```
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
apt-get install -y nodejs
```

## Wiring Pi

```
cd /opt
git clone git://git.drogon.net/wiringPi
cd wiringPi
./build
```

## Install ffmpeg

Required for sound recording and other media stuff.

```
apt-get install -y libav-tools
ln -fs /usr/bin/avconv /usr/bin/ffmpeg
```

## put tmpfs onto ram

Well suited for temporary logfiles, so the SD card doesn't wear so fast.

```
nano /etc/fstab
tmpfs /tmp tmpfs nodev,nosuid,relatime,size=300M 0 0
reboot now
```

## Set up the IoT-raspberry client itself

... finally ... ;-)

```
git clone https://github.com/d89/IoT-raspberry.git /var/www/IoT-raspberry
chmod +x /var/www/IoT-raspberry/actors/*
chmod +x /var/www/IoT-raspberry/sensors/*
chmod +x /var/www/IoT-raspberry/update
cd /var/www/IoT-raspberry/client
npm install
```

## Configuration

***main configuration***

```
cd /var/www/IoT-raspberry/client
cp config.js.sample config.js
nano config.js
```

* serverUrl: base url of the [IoT Server](https://github.com/d89/IoT-server) to connect to
* clientName: how your Raspberry reports itself to the server
* basePath: where you installed your IoT-raspberry (if you followed this guide, it'll be ```/var/www/IoT-raspberry```)
* mediaBasePath: Where audio files are stored. Create this folder, if not already existent

## Launch

for a quick launch, while you are connected via SSH:

```
cd /var/www/IoT-raspberry/client
node index.js
```

For a more sophisticated operation, use a service autostarting after reboot.

---

## Register as a service

```
npm install -g pm2
cd /var/www/IoT-raspberry/client && pm2 start index.js --name iot-client && pm2 startup
```

***restart service***

```
pm2 restart iot-client
pm2 stop iot-client
```

***logs and monitoring***

```
pm2 logs iot-client
pm2 show iot-client
pm2 list iot-client
pm2 monit iot-client
```

See http://pm2.keymetrics.io/docs/usage/quick-start/

# Modules

Congratulations! You just set up the basic installation of the Raspberry IoT Client. By default, you are now able to control the following actors and read the folliwng sensors via the [IoT Server](https://github.com/d89/IoT-server) web interface. These don't require any hardware sensors to be plugged to your Raspberry, so this configuration runs "out of the box".

***Actors***

* scenario (bundle actors together to a scenario, like "coming home" -> turn lights on, turn music on, turn on TV)
* http (execute HTTP POST and GET requests)
* push (send push notifications via the IoT Server)
* mail (send mails via the IoT server)

***Sensors***

* cputemp (measure the current CPU temperature)
* date (send the current date to the IoT Server for being able to trigger conditions time driven)
* time (send the current time to the IoT Server for being able to trigger conditions time driven)
* load (current system load)
* mem (current memory usage)
* diskfree (current disk usage)
* reachability (reachability of a certain IP in your network. Useful for detecting if you are at home, when you put your smartphone IP here)

The IoT Client comes with lots of modules that you can enable in your config, when you have the corresponding sensors / actors connected to your Pi. Go see the full [documentation](blob/develop/documentation/modules.md) of the available modules.
