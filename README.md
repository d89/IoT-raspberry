# IoT-raspberry
Home control client unit that works together with IoT-server.

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

* serverUrl: base url of the IoT-server to connect to
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

## Youtube Downloader

```
wget https://yt-dl.org/latest/youtube-dl -O /usr/local/bin/youtube-dl
chmod a+x /usr/local/bin/youtube-dl
hash -r
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

## Bluetooth Reachability

If you are on Debian Jessie and use a Rasberry Pi 3, you don't need to enable/install anything. 

If you use a Raspberry Pi 1 or 2, you have to buy one of these guys: http://www.amazon.de/CSL-Bluetooth-Adapter-Technologie-neuester-Standard/dp/B00C68IQ3C
On top of that, you have to install some packages for bluetooth to work properly on your Raspberry Pi 1 / 2:

```
apt-get install --no-install-recommends bluetooth
```

***Scanning for bluetooth devices***

You can scan for "normal" Bluetooth devices (like your smartphone, when the bluetooth screen is open) with:

```
hcitool scan
```

Also, it's possible to scan for Bluetooth LE devices (like wearables for example) with:

```
hcitool lescan
```

The Bluetooth Address you get from the ```hcitool scan``` command can be pinged:

```
l2ping -c 1 B8:27:EB:99:A1:CF
```

Note, that you cannot ping Bluetooth LE devices. Additionally to that, there is the ```bluetoothctl``` tool that offers you to pair to devices and do additional things. Try that, if you want. The IoT-client component just depends on ```hcitool``` and ```l2ping``` to check for the availability of a bluetooth device.

More infos:

* https://www.element14.com/community/docs/DOC-81266/l/setting-up-bluetooth-on-the-raspberry-pi-3
* https://www.raspberrypi.org/learning/robo-butler/bluetooth-setup/

## Text To Speech

If you want to use the TTS module, you can choose between the excellent online TTS service http://voicerss.org (with 300 free requests per day) and the local TTS engine "festival".

***voicerss.org***

Requires you to register for free and obtain an API key. Consult the sample configuration for the correct place to put your API key. See http://www.voicerss.org/api/documentation.aspx for the supported languages. voicerss gives you back an mp3 file which is downloaded and cached on your Raspberry, so you don't have to redownload the mp3 file on every subsequent request. 5 files are kept (see voice.js for details).  

***Festival***

Festival (http://www.cstr.ed.ac.uk/projects/festival/) is a local TTS engine that needs to be installed:

```
apt-get install -y festival
```

Having done that, you can activate festival as TTS provider (see the sample configuration). You need to specify a language. Retrieve all available languages via ```festival --help```.

## Voice recognition

There are several "players" in the voice recognition business for the raspberry pi, most notably:

* Jasper: online and offline, multiple engines: http://jasperproject.github.io/
* PiAUISuite: only online, google engine: https://github.com/StevenHickson/PiAUISuite
* AlexaPi, only online, amazon engine: https://github.com/sammachin/AlexaPi

Sadly, Jasper and PiAUI are super-outdated and don't work properly anymore due to changes in the Google Text To Speech and Speech To Text API. AlexaPi is currently very limited, because you can't define own commands.

So I decided to come up with my own engine, which is based on ```pocketsphinx``` and the Google Voice Recognition API. The idea behind it: The raspberry listens to a "hot word" using pocketsphinx. Something like ```Ok, Pi```. As soon as the raspberry recognizes this, you will hear a "beep sound" indicating that you can now talk to the raspberry and tell your command until you hear the next beep (3 seconds later). Between these 2 beeps, you can tell your raspberry, what you want. This command is sent to the Google Voice Recognition API, because pocketsphinx is not good enough to understand complex commands. By the way: google is super picky with the format of the audio file. I succeeded with a mono FLAC file in 16000hz. Mono seems to be especially important. 

```pocketsphinx``` listens always and is basically the "gatekeeper" for the Google Voice Recognition API. The Google API requires an API key and limits the requests per day, that you can make (~50). You can keep track of the used quote here: https://console.developers.google.com/apis/api/speech/usage?project=your-project-key

To register and retrieve your Google Voice Recognition Access token, go here and activate the API. Retrieve the "browser key" afterwards as described: https://console.developers.google.com/apis/api/speech/overview?project=your-project-key

Install pocketsphinx like this:

```
apt-get install -y curl flac pocketsphinx
... or compile from source, if you really want to: http://raspberrypi.stackexchange.com/a/10392
Verify with "which pocketsphinx_continuous" after you are done
```

Now create a file on your Desktop that defines the commands you want the raspberry to understand via pocketsphinx, your "hot words". They should not be too short and not be too long. If you put too few of them, it tends to work worse. "raspberry" is general seems to work well.

```
please hear
hello listen
heads up
okay raspberry listen
open garage door
```

Put these in a textfile and upload the text file at http://www.speech.cs.cmu.edu/tools/lmtool-new.html. After processing, put the

* .dic file as dic.dic
* .lm file as lm.lm

to ```/opt/voicerec``` on your pi.

```
mkdir /opt/voicerec
curl -o /opt/voicerec/dic.dic http://www.speech.cs.cmu.edu/tools/product/1459715270_08780/2370.dic
curl -o /opt/voicerec/lm.lm http://www.speech.cs.cmu.edu/tools/product/1459715270_08780/2370.lm
```

Register the ```voicerecognizer``` sensor in the config with

* the executable of pocketsphinx (normally ```/usr/bin/pocketsphinx_continuous```)
* the path to your lm.lm (```/opt/sphinx/lm.lm```)
* the path to your dic.dic (```/opt/sphinx/dic.dic```)
* Your google voice api key

You should be good to go now!

## BMP180 / GY-68 barometric sensor

measures temperature and pressure: http://www.amazon.de/BMP180-Digitaler-Luftdrucksensor-Arduino-Raspberry-Pi-Drone/dp/B00R8KKE2E

```
git clone https://github.com/adafruit/Adafruit_Python_BMP.git /opt/barometric
cd /opt/barometric
python setup.py install
```

## 1 Wire ds18b20 temperature sensor

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

add to bottom of file:

wire
w1-gpio pullup=1
w1-therm
```

Activate in device tree (newer raspbian versions):

```
nano /boot/config.txt 

add to bottom of file:

dtoverlay=w1-gpio,gpiopin=4,pullup=on
```

Reboot: 

```
reboot now
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

in ```nano /etc/modules``` add (or make sure they are present):

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

## LED Strip & Lightshow

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

## Camera

```raspivid``` and ```raspistill``` are used. They are preinstalled.

* https://www.raspberrypi.org/documentation/usage/camera/raspicam/raspivid.md
* https://www.raspberrypi.org/documentation/raspbian/applications/camera.md
* http://jankarres.de/2013/05/raspberry-pi-raspistill-und-raspivid-parameter/
* http://raspberrypiguide.de/howtos/raspberry-pi-camera-how-to/

---

## FHEM installieren

FHEM wird für die Interaktion mit z.B. Homematic oder Z-Wave Komponenten benötigt.

```
apt-get install -y libdevice-serialport-perl libio-socket-ssl-perl libwww-perl libxml-simple-perl
mkdir /opt/fhem
cd /opt/fhem
wget http://fhem.de/fhem-5.7.deb 
dpkg -i fhem-5.7.deb
chmod -R a+w /opt/fhem 
usermod -a -G tty pi
usermod -a -G tty fhem
```
Dann:
```
nano /opt/fhem/fhem.cfg
```

nach ```define WEB FHEMWEB 8083 global``` einfügen: ```attr WEB basicAuth YWRtaW46YWRtaW4=``` (entspricht base64 ```echo -n admin:admin | base64```)
Die Zeile ```define initialUsbCheck notify global:INITIALIZED usb create``` unbedingt in der Config auskommentieren, sonst lädt sich das Webinterface zu tode.

Anschließend:

```
/etc/init.d/fhem stop
/etc/init.d/fhem start
```

***Update FHEM***

```update``` in Actionbar eingeben. Danach ```shutdown restart```

## Homematic Heizungssteuerung

* Hervorragende Übersicht der Möglichkeiten: http://www.meintechblog.de/2015/02/fhem-welches-gateway-fuer-welches-system/
* Thermostat: Homematic 105155 (http://www.amazon.de/gp/product/B00CFF3410/)
* Konfigurations-Adapter (statt CUL-Stick): Homematic 104134 - http://www.amazon.de/eQ-3-HomeMatic-104134-Homematic-Konfigurations-Adapter/dp/B007VTXP0A/
* Ein paar sinnvolle FHEM Kommandos: http://www.ply.me.uk/bits_and_pieces/fhem_snippets.html
* Artikel über das Anlernen (mit Schaltzeiten) des Homematic 105155: http://www.security-blog.eu/homematic-funk-thermostat-mit-fhem-zeitsteuern-steuern/ bzw. http://www.meintechblog.de/2013/12/fhem-heizungssteuerung-per-anwesenheitserkennung/
* Siehe auch http://www.fhemwiki.de/wiki/HM-CFG-USB_USB_Konfigurations-Adapter bzw. https://git.zerfleddert.de/cgi-bin/gitweb.cgi/hmcfgusb

***Treiber für Konfigurations-Adapter:***

```
apt-get install -y libusb-1.0-0-dev
mkdir /opt/hmusb && cd /opt/hmusb
wget https://git.zerfleddert.de/hmcfgusb/releases/hmcfgusb-0.102.tar.gz
tar xzf hmcfgusb-0.102.tar.gz
mv hmcfgusb-0.102/* .
make
cp hmcfgusb.rules /etc/udev/rules.d/
```

***Firmware-Update des HMUSB***

fhem bzw. den deamon stoppen, falls schon installiert. 

Firmware-Check (Vor Flash):
```
/opt/hmusb/hmland -i
Output etwa: HHM-USB-IF,03C4,MEQ0231318,373300,000000,0614745A,0000 (Die 03C4 ist vorher hierbei die Version in Hex (in Dezimal: 964).)
```

Flashen:
```
cd /opt/hmusb
wget http://git.zerfleddert.de/hmcfgusb/firmware/hmusbif.03c7.enc
./flash-hmcfgusb hmusbif.03c7.enc
```

Testen:
```
/opt/hmusb/hmland -i
Nach Flash: HHM-USB-IF,03C7,MEQ0231318,373300,000000,00012D6B,0000,00
```

***Startscript in /etc/init.d/hmland***

```
cp /var/www/IoT-raspberry/actors/hmusbdriver/hmland /etc/init.d
chmod 755 /etc/init.d/hmland
update-rc.d hmland defaults
service hmland start
```

Manueller Start des HMUSB Deamons (falls mal zum Test nötig - klappt nur, wenn der Deamon nicht bereits läuft): ```/opt/hmusb/hmland -p 1234 -D```

***hmusb Stick in FHEM anmelden***

* Anmeldung: ```define hmusb HMLAN 127.0.0.1:1234``` (Port muss dem Startscript entsprechen)
* HM-ID setzen (je nach Stick): ```attr hmusb hmId 373300```
* "Save config" klicken, um die Einstellungen zu persistieren

***Komponente inkludieren (Homematic 105155)***

* Reset (falls nötig): eine Batterie entfernen, dann wieder einlegen. Direkt danach alle 3 Knöpfe drücken. Dann nochmal mit dem mittleren Button "res" bestätigen.
* Einstellungen (Datum, Uhrzeit) jeweils mit der mittleren Taste bzw. dem Drehrad bestätigen
* In FHEM: ```set hmusb hmPairForSec 60```
* Mehrere Sekunden den mittleren Knopf drücken, um "ins" zu bestätigen. Ein Countdown zählt herunter. Wenn die Inkludierung geklappt hat, erscheint "AC" auf dem Display
* Jetzt einmal kurz den mittleren Button drücken, sodass "ada" erscheint. Das Thermostat zieht sich nun fest.
* Nach Abschluss dessen muss der manuelle Modus aktiviert werden. Dazu auf den linken Button drücken (die Uhr), bis "Manu" links oben im Display erscheint
* "Save Config" in FHEM drücken
* State des HMUSB abrufen per http://RASPI_IP:8083/fhem?detail=hmusb
 
***ggf. Name der Komponente ändern***

```
rename HM_37F678 WohnzimmerFenster
rename HM_37F678_Clima WohnzimmerFenster_Clima
attr WohnzimmerFenster_Clima room Wozhnzimmer
```

---

## Z-Wave per FHEM

Mittels Z-Wave ZME_UZB1 Me USB Stick (http://www.amazon.de/gp/product/B00QJEY6OC)

* An FHEM anmelden, wenn nicht automatisch ohnehin schon passiert (prüfen per http://RASPY_IP:8083/fhem?detail=ZWDongle_0): ```define ZWDongle_0 ZWDongle /dev/ttyACM0@115200```
* Inkludieren per ```set ZWDongle_0 addNode onNw```
* Stoppen der Inklusion per ```set ZWDongle_0 addNode off```
* Exkludieren per ```set ZWDongle_0 removeNode onNw```, dann Knopf am Gerät drücken, danach ```set ZWDongle_0 removeNode off```. Anschließend Gerät aus FHEM entfernen: ```delete ZWave_THERMOSTAT_10```
* Umbenennen von Z-Wave Komponenten: ```rename KomponentenNameZWave GewuenschterNeuerName```
* Zuweisen von Komponenten zu Räumen: ```attr GewuenschterNeuerName room Wohnzimmer```
* Home ID abfragen: ```get ZWDongle_0 homeId```
* Geräteliste des Dongles abrufen: ```get ZWDongle_0 nodeList```
* Deviceinfos erhalten: ```list ZWave_THERMOSTAT_10```
* FHEM Referenz zu Z-Wave: http://fhem.de/commandref.html#ZWave

Nach jeder Operation auf "Save config" drücken, um die FHEM Konfiguration zu speichern.

### Danfoss Living Connect Z (014G0013) Thermostat 

http://www.amazon.de/Danfoss-Heizk%C3%B6rperthermostat-Stellantrieb-LC-13-DAN_LC-13/dp/B00IGE38JM

* Reset: Eine Batterie herausnehmen und wieder einlegen. Während des Einlegens den Mittelknopf gedrückt halten. 
* Nach Inkludieren: Den Montagemodus beenden, indem der Hauptknopf (in der Mitte) lange gedrückt wird. Danach braucht das Thermostat 2 Zusatzkommandos, um korrekt zu funktionieren.

* ```set ZWave_THERMOSTAT_11 WakeupInterval 100 1``` -> Alle 100 Sekunden aufwachen und an Controller (mit ID 1) reporten.
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
* Mit Controller assoziieren (um Live-Updates zu bekommen): ```set ZWave_SENSOR_BINARY_31 associationAdd 3 1```
* Regelmäßig Lux-Updates schicken: ```set ZWave_SENSOR_BINARY_31 configIlluminationReportsInterval 60```
* Ab 1 Lux Änderung Report schicken: ```set ZWave_SENSOR_BINARY_31 configIlluminationReportThreshold 1```
* Regelmäßig Temp-Updates schicken: ```set ZWave_SENSOR_BINARY_31 configIntervalOfTemperatureMeasuring 60```
* Regelmäßg Temperatur-Updates schicken: ```set ZWave_SENSOR_BINARY_31 configTemperatureReportsInterval 60```
* Bei 0,1°C Änderung Temperatur-Report schicken: ```set ZWave_SENSOR_BINARY_31 configTemperatureReportThreshold 1	```
* Alarm 15 Sekunden aufrecht erhalten und danach dann neu triggern: ```set ZWave_SENSOR_BINARY_31 configMotionAlarmCancellationDelay 15```

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
* Mit Controller assoziieren (um Live-Updates zu bekommen): ```set ZWave_SWITCH_BINARY_30 associationAdd 3 1```
* Bei 1% Änderung neuen Stand an Controller senden: ```set ZWave_SWITCH_BINARY_30 configImmediatePowerReport 1```
* Alle 0,01kwH Gesamt-Verbrauchsupdates schicken: ```set ZWave_SWITCH_BINARY_30 configReportingChangesInEnergyConsumed45 1```
* Bei 1% Änderung neuen Stand an Controller senden: ```set ZWave_SWITCH_BINARY_30 configStandardPowerLoadReporting 1```

***Werte:***
```
smStatus: Wattzahl
swbStatus: on/off
meter: kwh
```

# Optional and other Stuff

## Mappings

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

## Configure USB soundcard

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

## Sound wiedergeben

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