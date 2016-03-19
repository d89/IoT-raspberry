# IoT-raspberry
Home control client unit that works together with IoT-server

## Raspi Config

```
raspi-config
1 -> Expand Filesystem
5 -> Internationalisation Options -> Change Locale, Change Timezone
6 -> Enable Camera
9 -> Advanced Options -> A4: SSH, A5: Device Tree, A6: SPI, A7: I2C
Finish
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

Since debian jessie, most of the guides you will find in the internet are obsolete as ```dhcpcd``` and ```wpa_supplicant``` is used. No more ```/etc/network/interfaces```. Use https://www.raspberrypi.org/documentation/configuration/wireless/wireless-cli.md and http://www.amazon.de/EDIMAX-EW-7811UN-Wireless-Adapter-IEEE802-11b/dp/B003MTTJOY

***wifi connection***

```
nano /etc/wpa_supplicant/wpa_supplicant.conf

network={
   ssid="your_ssid"
   psk="your_password"
}
```

***static ip***

```
nano /etc/dhcpcd.conf

interface wlan0
   static ip_address=192.168.0.70/24
   static routers=192.168.0.1
   static domain_name_servers=192.168.0.1
```

## Firmware Update

```
wget https://raw.githubusercontent.com/Hexxeh/rpi-update/master/rpi-update -O /usr/bin/rpi-update
chmod +x /usr/bin/rpi-update
rpi-update
reboot now
```

## Essentials

Don't skip this! These tools are basically necessary for everything else later on.

```
apt-get update
apt-get install build-essential git gpac mpg321 omxplayer python-dev libboost-python-dev python-pip python-smbus i2c-tools
```

## Node 5 (or above)

```
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
apt-get install -y nodejs
```

## Youtube Downloader

```
wget https://yt-dl.org/latest/youtube-dl -O /usr/local/bin/youtube-dl
chmod a+x /usr/local/bin/youtube-dl
hash -r
```

## Wiring Pi

```
cd /opt
git clone git://git.drogon.net/wiringPi
cd wiringPi
./build
```

## Pi-Switch

for switching rc plugs: https://github.com/lexruee/pi-switch-python

```
pip install pi_switch
```

## DHT11 temperature sensor

measures temperature and humidty: http://www.amazon.de/DHT-11-Digital-Temperature-Humidity-Sensor/dp/B008AGLXGQ

```
git clone https://github.com/adafruit/Adafruit_Python_DHT.git /opt/dht11
cd /opt/dht11
python setup.py install
```

## BMP180 / GY-68 barometric sensor

measures temperature and pressure: http://www.amazon.de/BMP180-Digitaler-Luftdrucksensor-Arduino-Raspberry-Pi-Drone/dp/B00R8KKE2E

```
git clone https://github.com/adafruit/Adafruit_Python_BMP.git /opt/barometric
cd /opt/barometric
python setup.py install
```

##  1 Wire ds18b20

http://www.amazon.de/Digitaler-Edelstahl-Temperatur-Thermometer-wasserdicht/dp/B018M7T7Q0/

Activate 1 wire modules:

```
modprobe wire
modprobe w1-gpio pullup=1
modprobe w1-therm
```

Check, if activated: ```lsmod```

Load modules after boot:

```
nano /etc/modules
wire
w1-gpio pullup=1
w1-therm
```

Activate in device tree (newer raspbian versions):

```
nano /boot/config.txt 
dtoverlay=w1-gpio,gpiopin=4,pullup=on
```

Read temperature via:

```
grep "t=" /sys/bus/w1/devices/28-*/w1_slave
```

## activate i2c

for
* lcd display
* barometric sensor
* ad/da 

https://www.auctoritas.ch/bauprojekte/4-ein-sainsmart-lcd-display-am-raspberry-pi-verwenden

in ```nano /etc/modules``` add:

```
i2c-bcm2708 
i2c-dev
```

for: SainSmart IIC/I2C/TWI Serial 2004 Character 20x4 LCD Display Modul: https://www.auctoritas.ch/bauprojekte/4-ein-sainsmart-lcd-display-am-raspberry-pi-verwenden

check with

```
i2cdetect 1
or
i2cdetect -y 1
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
cd /var/www/IoT-raspberry
npm install
```

## Configuration

***main configuration***

```
nano /var/www/IoT-raspberry/client/config.js
```

* serverUrl: base url of the IoT-server to connect to
* clientName: how your Raspberry reports itself to the server
* basePath: where you installed your IoT-raspberry (if you followed this guide, it'll be ```/var/www/IoT-raspberry```)
* mediaBasePath: Where audio files are stored. Create this folder, if not already existent

***passwords***

```
nano /var/www/IoT-raspberry/client/config-passwords.js
```

* password: Will be used as login on the server you specified at ```serverUrl``` in the main configuration file ```config.js```
* ttsApiKey: Text To Speech API key that is being used for the ```voice``` actor. 

## Launch

for a quick launch, while you are connected via SSH:

```
node index.js
```

For a more sophisticated operation, use a service autostarting after reboot.

---

## Register as a service

```
npm install -g pm2
pm2 start /var/www/IoT-raspberry/client/index.js --name iot-client && pm2 startup
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

## Other stuff follows here

### Mappings

Wiring Pi: ```gpio readall```

```
 +-----+-----+---------+------+---+---Pi 2---+---+------+---------+-----+-----+
 | BCM | wPi |   Name  | Mode | V | Physical | V | Mode | Name    | wPi | BCM |
 +-----+-----+---------+------+---+----++----+---+------+---------+-----+-----+
 |     |     |    3.3v |      |   |  1 || 2  |   |      | 5v      |     |     |
 |   2 |   8 |   SDA.1 |   IN | 1 |  3 || 4  |   |      | 5V      |     |     |
 |   3 |   9 |   SCL.1 |   IN | 1 |  5 || 6  |   |      | 0v      |     |     |
 |   4 |   7 | GPIO. 7 |   IN | 1 |  7 || 8  | 1 | ALT0 | TxD     | 15  | 14  |
 |     |     |      0v |      |   |  9 || 10 | 1 | ALT0 | RxD     | 16  | 15  |
 |  17 |   0 | GPIO. 0 |  OUT | 0 | 11 || 12 | 0 | IN   | GPIO. 1 | 1   | 18  |
 |  27 |   2 | GPIO. 2 |   IN | 1 | 13 || 14 |   |      | 0v      |     |     |
 |  22 |   3 | GPIO. 3 |   IN | 1 | 15 || 16 | 1 | IN   | GPIO. 4 | 4   | 23  |
 |     |     |    3.3v |      |   | 17 || 18 | 0 | IN   | GPIO. 5 | 5   | 24  |
 |  10 |  12 |    MOSI |   IN | 0 | 19 || 20 |   |      | 0v      |     |     |
 |   9 |  13 |    MISO |   IN | 0 | 21 || 22 | 0 | IN   | GPIO. 6 | 6   | 25  |
 |  11 |  14 |    SCLK |   IN | 0 | 23 || 24 | 1 | IN   | CE0     | 10  | 8   |
 |     |     |      0v |      |   | 25 || 26 | 1 | IN   | CE1     | 11  | 7   |
 |   0 |  30 |   SDA.0 |   IN | 1 | 27 || 28 | 1 | IN   | SCL.0   | 31  | 1   |
 |   5 |  21 | GPIO.21 |   IN | 1 | 29 || 30 |   |      | 0v      |     |     |
 |   6 |  22 | GPIO.22 |   IN | 1 | 31 || 32 | 0 | IN   | GPIO.26 | 26  | 12  |
 |  13 |  23 | GPIO.23 |   IN | 0 | 33 || 34 |   |      | 0v      |     |     |
 |  19 |  24 | GPIO.24 |   IN | 0 | 35 || 36 | 1 | IN   | GPIO.27 | 27  | 16  |
 |  26 |  25 | GPIO.25 |   IN | 0 | 37 || 38 | 0 | IN   | GPIO.28 | 28  | 20  |
 |     |     |      0v |      |   | 39 || 40 | 0 | IN   | GPIO.29 | 29  | 21  |
 +-----+-----+---------+------+---+----++----+---+------+---------+-----+-----+
 | BCM | wPi |   Name  | Mode | V | Physical | V | Mode | Name    | wPi | BCM |
 +-----+-----+---------+------+---+---Pi 2---+---+------+---------+-----+-----+
```

GPIO Mapping Raspberry 2: http://www.element14.com/community/servlet/JiveServlet/previewBody/73950-102-4-309126/GPIO_Pi2.png?01AD=3lnx_cxwfZDoPGf2yt6YEgRzLIZJQi6cxPZlHcksSGF1h-MkIeePk3Q&01RI=38876E403D2DF1C&01NA=

### Configure USB soundcard

Falls nicht der 3,5" Klinkenstecker verwendet werden soll (zwar bessere Soundqualität, aber anfälliger für System-Crashes):

```sudo nano /usr/share/alsa/alsa.conf```

Folgende Zeilen ändern:

```
defaults.ctl.card 0
defaults.pcm.card 0
```

in:

```
defaults.ctl.card 1
defaults.pcm.card 1
```

Die ```1``` ist das USB Soundkarten-Interface aus ```cat /proc/asound/cards``` bzw. ```alsamixer -> F6```

Danach ```reboot``` 

Siehe auch (vorsicht: da alte und mittlerweile nicht mehr gültige Config-Datei): http://computers.tutsplus.com/articles/using-a-usb-audio-device-with-a-raspberry-pi--mac-55876

###Sound wiedergeben

Soundvolumen anpassen per Befehl: 

```
amixer set PCM -- -2000
```

Setzt Volume auf -20db. 

Kontrolle per ```alsamixer```

Wav Dateien spielen: ```aplay /home/pi/Music/gong.wav```

Mp3 Dateien spielen:

Entweder

```
sudo apt-get -y install mpg321
mpg321 /home/pi/Music/siren.mp3
```

oder

```
apt-get install -y omxplayer
omxplayer /home/pi/Music/siren.mp3
```

Empfehlung: ```omxplayer```, weil mp3 ***und*** wav Dateien wiedergegeben werden. Problem: ```omxplayer``` respektiert nicht die Einstellungen von ```alsamixer``` und ```amixer``` - Wiedergabe über alsa geht generell nicht (d.h. nur USB wird unterstützt, nicht der normale Klinkenanschluss). Daher muss die Lautstärke mitgegben werden:

```
omxplayer --vol -2000 /home/pi/Music/siren.mp3
```

Stellt die Lautstärke ebenso auf -20db.

### LED Strip & Lightshow

Bei ebay: 2m 5V LPD8806 52LED/m White FPCA IP67 Waterproof: http://www.ebay.de/itm/111767798377

Werden über SPI angeschlossen. Pin 19 (SPI_MOSI), Pin 23 (SPI_CLOCK)

In meiner Variante:

```
Rot = 5V DC
Blau = Masse
Schwarz = Daten (= Pin 19)
Grün = Clock (= Pin 23)
```

5V Stromversorgung über http://www.ebay.de/itm/281879049132 5V 10A 50W Netzteil mit Connector https://www.google.de/search?q=female+dc+connector

* Wichtig: Ground muss mit dem RPI Ground über das Breadboard geteilt werden.
* Siehe auch: https://www.raspberrypi.org/documentation/hardware/raspberrypi/spi/README.md
* Zum Test, ob SPI korrekt aktiviert wurde: https://raw.githubusercontent.com/raspberrypi/linux/rpi-3.10.y/Documentation/spi/spidev_test.c (wird hier ganz nett beschrieben: http://www.brianhensley.net/2012/07/getting-spi-working-on-raspberry-pi.html)
* Library zum Ansteuern der LEDs: https://bitbucket.org/ricblu/rpi-lpd8806/src bzw. https://www.npmjs.com/package/lpd8806
* Wie wird das ganze angeschlossen? https://learn.adafruit.com/raspberry-pi-spectrum-analyzer-display-on-rgb-led-strip/led-strip-and-rgb-led-software
* Auch als Video: https://www.youtube.com/watch?v=0uXjyvZ9JGM (Achtung: Betrieb des Raspberry über das gleiche 5V Netzteil ist schwierig, da so alle Schutzmaßnahmen des Raspberry außer Kraft gesetzt werden) 

***Achtung:*** Unbedingt darauf achten, dass das LED Band richtig herum angeschlossen wird (Es gibt einen Eingang und einen Ausgang, die Seite ist also nicht egal), und das Ground mit dem Raspberry geteilt wird.

```
git clone https://togiles@bitbucket.org/togiles/lightshowpi.git /opt/lightshow/lightshowpi
cd /opt/lightshow/lightshowpi
git fetch && git checkout master
./install.sh
```

***Cofigure:***

Disable the "pre show" and set as much zeros as you have rows in the led strip. The number of LEDs will be split by the amount of rows. These are not real "gpio pins", they are just used to separate the rows.

```
nano /opt/lightshow/lightshowpi/config/overrides.cfg
```

with content:

```
[hardware]
gpio_pins = 0,0,0,0,0,0,0,0

[lightshow]
preshow_script =
preshow_configuration =
```

Now replace py/synchronized_lights.py with the one from the repo. This is necessary, because the led strip driver lpd8806 with SPI is not supported "out of the box" by lightshowpi. So some edits to the main file were necessary to support the lpd8806. All the edits that were done are wrapper with ```IOT EDIT START``` and ```IOT EDIT END```. The library https://bitbucket.org/ricblu/rpi-lpd8806/src is being used, that is described in this README. 

If anything goes wrong, then the current config and the synchronized_lights.py are not in sync any more. In this case, take the one from  https://togiles@bitbucket.org/togiles/lightshowpi.git and add the sections between ```IOT EDIT START``` and ```IOT EDIT END``` to their respective place in the current version of synchronized_lights.py.

```
mv /opt/lightshow/lightshowpi/py/synchronized_lights.{py,py.bak}
cp /var/www/IoT-raspberry/actors/lightshowdriver/synchronized_lights.py /opt/lightshow/lightshowpi/py/
chmod +x /opt/lightshow/lightshowpi/py/synchronized_lights.py
```

###Camera

```raspivid``` and ```raspistill``` are used. They are preinstalled.

* https://www.raspberrypi.org/documentation/usage/camera/raspicam/raspivid.md
* https://www.raspberrypi.org/documentation/raspbian/applications/camera.md
* http://jankarres.de/2013/05/raspberry-pi-raspistill-und-raspivid-parameter/
* http://raspberrypiguide.de/howtos/raspberry-pi-camera-how-to/

---

###Homematic Heizungssteuerung

* Hervorragende Übersicht der Möglichkeiten: http://www.meintechblog.de/2015/02/fhem-welches-gateway-fuer-welches-system/
* Thermostat: Homematic 105155 (http://www.amazon.de/gp/product/B00CFF3410/)
* Konfigurations-Adapter (statt CUL-Stick): Homematic 104134 - http://www.amazon.de/eQ-3-HomeMatic-104134-Homematic-Konfigurations-Adapter/dp/B007VTXP0A/

***Treiber für Konfigurations-Adapter:***

```
apt-get install libusb-1.0-0-dev
mkdir /opt/hmlan
cd /opt/hmlan
wget https://git.zerfleddert.de/hmcfgusb/releases/hmcfgusb-0.102.tar.gz
tar xzf hmcfgusb-0.102.tar.gz
cd hmcfgusb-0.102
make
mv hmcfgusb-0.102/* .
sudo cp hmcfgusb.rules /etc/udev/rules.d/
```
Siehe auch http://www.fhemwiki.de/wiki/HM-CFG-USB_USB_Konfigurations-Adapter bzw. https://git.zerfleddert.de/cgi-bin/gitweb.cgi/hmcfgusb

***Firmware-Update des HMUSB***

fhem bzw. den deamon stoppen, falls schon installiert. Dann: ```/opt/hmlan/hmland -i``` aufrufen.

Die 03C4 ist vorher hierbei die Version in Hex (in Dezimal: 964).

```Vor flash:  HHM-USB-IF,03C4,MEQ0231318,373300,000000,0614745A,0000```

Flashen:
```
cd /opt/hmlan
wget http://git.zerfleddert.de/hmcfgusb/firmware/hmusbif.03c7.enc
./flash-hmcfgusb hmusbif.03c7.enc
```

```Nach Flash: HHM-USB-IF,03C7,MEQ0231318,373300,000000,00012D6B,0000,00```

Manueller Start des HMUSB Deamons: ```/opt/hmlan/hmland -p 1234 -D```

***Startscript in /etc/init.d/hmland***

```
#!/bin/sh
# simple init for hmland
### BEGIN INIT INFO
# Provides:          hmland
# Required-Start:    $network $local_fs $remote_fs
# Required-Stop::    $network $local_fs $remote_fs
# Should-Start:      $all
# Should-Stop:       $all
# Default-Start:     2 3 4 5
# Default-Stop:      0 1 6
# Short-Description: Start hmland daemon at boot time
# Description:       Provide Service to use HM-USB-CFG Adapter for FHEM.
### END INIT INFO

pidfile=/var/run/hmland.pid
port=1234

case "$1" in
 start|"")
	chrt 50 /opt/hmlan/hmland -r 0 -d -P -l 127.0.0.1 -p $port 2>&1 | perl -ne '$|=1; print localtime . ": [hmland] $_"' >> /var/log/hmland.log &
	;;
 restart|reload|force-reload)
	echo "Error: argument '$1' not supported" >&2
	exit 3
	;;
 stop)
	killall hmland
	;;
 status)
	if [ ! -e $pidfile ]; then
		echo "No pid"
		exit 1
	fi
	pid=`cat $pidfile`
	if kill -0 $pid &>1 > /dev/null; then
		echo "Running"
		exit 0
	else
		rm $pidfile
		echo "Not running"
		exit 1
	fi
	;;
 *)
	echo "Usage: hmland [start|stop|status]" >&2
	exit 3
	;;
esac
```

Und aktivieren:

```
sudo chmod 755 /etc/init.d/hmland
update-rc.d hmland defaults
sudo service hmland start
```

***FHEM installieren***

FHEM wird für die Interaktion mit den Homematic Komponenten benötigt.

```
apt-get install -y libdevice-serialport-perl libio-socket-ssl-perl libwww-perl libxml-simple-perl
mkdir /opt/fhem
cd /opt/fhem
wget http://fhem.de/fhem-5.7.deb 
dpkg -i fhem-5.7.deb
chmod -R a+w /opt/fhem 
usermod -a -G tty pi
usermod -a -G tty fhem
echo -n admin:admin | base64
```
Dann:
```
nano /opt/fhem/fhem.cfg
```

nach ```define WEB FHEMWEB 8083 global``` einfügen: ```attr WEB basicAuth YWRtaW46YWRtaW4=``` (entspricht base64 admin:admin)
Die Zeile ```define initialUsbCheck notify global:INITIALIZED usb create``` unbedingt in der Config auskommentieren, sonst lädt sich das Webinterface zu tode.

Anschließend:

```
/etc/init.d/fhem stop
/etc/init.d/fhem start
update (in FHEM textbox, then shutdown restart)
```

* Auth: ```attr global motd none```
* Anmeldung: ```define hmusb HMLAN 127.0.0.1:1234``` (Port muss dem Startscript entsprechen) 
* HM-ID setzen (je nach Stick): ```attr hmusb hmId 373300```
* Aktivieren des Pairings für 60 Sekunden: ```set hmusb hmPairForSec 60```
* State des HMUSB abrufen per http://RASPI_IP:8083/fhem?detail=hmusb 

***Update FHEM***

```update``` in Actionbar eingeben. Danach ```shutdown restart```

```
rename HM_37F678 WohnzimmerFenster
rename HM_37F678_Clima WohnzimmerFenster_Clima
attr WohnzimmerFenster_Clima room Wozhnzimmer
```

* Ein paar sinnvolle FHEM Kommandos: http://www.ply.me.uk/bits_and_pieces/fhem_snippets.html
* Artikel über das Anlernen (mit Schaltzeiten) des Homematic 105155: http://www.security-blog.eu/homematic-funk-thermostat-mit-fhem-zeitsteuern-steuern/ bzw. http://www.meintechblog.de/2013/12/fhem-heizungssteuerung-per-anwesenheitserkennung/

---

####HMUSB Intereaktion

***get desired temperature***

* http://RASPI_IP:8083/fhem?detail=HM_37F678&dev.getHM_37F678=HM_37F678&cmd.getHM_37F678=get&arg.getHM_37F678=param&val.getHM_37F678=desired-temp&XHR=1&addLinks=1
* bzw: http://RASPI_IP:8083/fhem?cmd={ReadingsVal("WohnzimmerFenster_Clima","desired-temp","")}&XHR=1

***get current temperature***
* http://RASPI_IP:8083/fhem?detail=HM_37F678&dev.getHM_37F678=HM_37F678&cmd.getHM_37F678=get&arg.getHM_37F678=param&val.getHM_37F678=measured-temp&XHR=1&addLinks=1
* http://RASPI_IP:8083/fhem?cmd={ReadingsVal("WohnzimmerFenster_Clima","measured-temp","")}&XHR=1


***set current temperature***

```
POST http://RASPI_IP:8083/fhem
Content-Type:application/x-www-form-urlencoded
params
	detail:WohnzimmerFenster_Clima
	dev.setWohnzimmerFenster_Clima:WohnzimmerFenster_Clima
	cmd.setWohnzimmerFenster_Clima:set
	arg.setWohnzimmerFenster_Clima:desired-temp
	val.setWohnzimmerFenster_Clima:11.5
```

---

### Z-Wave per FHEM

Mittels Z-Wave ZME_UZB1 Me USB Stick (http://www.amazon.de/gp/product/B00QJEY6OC)

* An FHEM anmelden, wenn nicht automatisch ohnehin schon passiert (prüfen per http://RASPY_IP:8083/fhem?detail=ZWDongle_0): ```define ZWDongle_0 ZWDongle /dev/ttyACM0@115200```
* Inkludieren per ```set ZWDongle_0 addNode nwOn```
* Stoppen der Inklusion per ```set ZWDongle_0 addNode off```
* Exkludieren per ```set ZWDongle_0 removeNode nwOn```, dann Knopf am Gerät drücken, danach ```set ZWDongle_0 removeNode off```. Anschließend Gerät aus FHEM entfernen: ```delete ZWave_THERMOSTAT_10```
* Umbenennen von Z-Wave Komponenten: ```rename KomponentenNameZWave GewuenschterNeuerName```
* Zuweisen von Komponenten zu Räumen: ```attr GewuenschterNeuerName room Wohnzimmer```
* Home ID abfragen: ```get ZWDongle_0 homeId```
* Geräteliste des Dongles abrufen: ```get ZWDongle_0 nodeList```
* Deviceinfos erhalten: ```list ZWave_THERMOSTAT_10```
* FHEM Referenz zu Z-Wave: http://fhem.de/commandref.html#ZWave

### Danfoss Living Connect Z (014G0013) Thermostat 

http://www.amazon.de/Danfoss-Heizk%C3%B6rperthermostat-Stellantrieb-LC-13-DAN_LC-13/dp/B00IGE38JM

Direkt nach dem Inkludieren den Montagemodus beenden, indem der Hauptknopf (in der Mitte) lange gedrückt wird. Danach braucht das Thermostat 2 Zusatzkommandos, um korrekt zu funktionieren.

* ```set WakeupInterval 100 1``` -> Alle 100 Sekunden aufwachen und an Controller (mit ID 1) reporten.
* ```define zwtrigger1 at +*00:01 get ZWave_THERMOSTAT_11 battery``` -> Jede Minute bei Thermostat 11 nachfragen (Batterie-Trigger)

---

### Fibaro Motion Sensor

Fibaro Motion Sensor: http://www.amazon.de/Z-Wave-FGMS-001-Fibaro-Motionsensor-FIB_FGMS-001/dp/B00JHHNUPY

***Reset:*** Knopf drücken, bis der Sensor gelb leuchtet. Button loslassen und direkt danach wieder kurz drücken. Jetzt das Gerät aus FHEM entfernen.

***Inkludieren:***

```
set ZWDongle_0 addNode onNw
```

Knopf am Motion Sensor 3mal direkt hintereinander drücken.

***Config***
* Mit Controller assoziieren (um Live-Updates zu bekommen): ```associationAdd 3 1```
* Regelmäßig Lux-Updates schicken: ```configIlluminationReportsInterval 60```
* Ab 1 Lux Änderung Report schicken: ```configIlluminationReportThreshold 1```
* Regelmäßig Temp-Updates schicken: ```configIntervalOfTemperatureMeasuring 60```
* Regelmäßg Temperatur-Updates schicken: ```configTemperatureReportsInterval 60```
* Bei 0,1°C Änderung Temperatur-Report schicken: ```configTemperatureReportThreshold 1	```
* Alarm 15 Sekunden aufrecht erhalten und danach dann neu triggern: ```configMotionAlarmCancellationDelay 15```

***Werte:***
```
smStatus: Lux
sbStatus: Alarmstatus
battery
```

---

### Fibaro Zwischenstecker

Fibaro Zwischenstecker: http://www.amazon.de/Z-Wave-Fibaro-Zwischenstecker-Schalter-FIBEFGWPF-102/dp/B00F9X7NLC/

***Reset:*** So lange den Button am Stecker drücken, bis der Ring gelb leuchtet. Dann die Taste loslassen und kurz erneut drücken. Der Stecker selbst kann dann aus FHEM entfernt werden (und sollte ausgeschaltet bleiben, bis der Stecker entfernt wurde).

***Inkludieren:***

```
set ZWDongle_0 addNode onNw
```

***Config***
* Mit Controller assoziieren (um Live-Updates zu bekommen): ```associationAdd 3 1```
* Bei 1% Änderung neuen Stand an Controller senden: ```configImmediatePowerReport 1```
* Alle 0,01kwH Gesamt-Verbrauchsupdates schicken: ```configReportingChangesInEnergyConsumed45 1```
* Bei 1% Änderung neuen Stand an Controller senden: ```configStandardPowerLoadReporting  1```

***Werte:***
```
smStatus: Wattzahl
swbStatus: on/off
meter: kwh
```