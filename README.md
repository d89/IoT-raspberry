# IoT-raspberry
Home control client server unit

## Server-Setup

```
npm install -g bower gulp forever
npm install
bower install
gulp (default task builds the "dist" folder from the "frontend" folder - this is where the frontend is served from)
node index.js (or use forever)
```

* Mongo-DB is required (default port)
* Config needs to be adjusted (in config.js) - for GCM Push token and SSL certs.
* Server starts on port 3000

## A little general guide for the CLIENT-part (on the raspberry)

### SSH aktivieren

sudo rasp-config

SSH dann im Menü einschalten
Dabei gleich noch GPIO einschalten.
Und auch eine Repartitionierung ist hier möglich, um die SD Karte maximal zu nutzen.

---

###Wiring Pi Mapping

Wiring Pi ist ein Utility zum einfachen Setzen und Abfragen von Ports. Es ist
auf der Kommandozeile per "gpio" Befehl aufrufbar und wird von verschiedenen
Libraries verwendet. Gerade C++ Scripte müssen häufig gegen Wiring Pi gelinkt
werden, um lauffähig zu sein. Bei WiringPi kommt ein anderes Port-Mapping
Schema zum Einsatz:

gpio readall

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
 
---

###dht11 Library kompilieren

gcc -o dht11 dht11.c -L/usr/local/lib -lwiringPi

---

###Funksteckdosen schalten

Ultimative Library dafür: https://github.com/lexruee/pi-switch-python

---

###Wireless Stick einrichten

```
sudo nano /etc/dhcpcd.conf

interface eth0
   static ip_address=192.168.0.59/24
   static routers=192.168.0.1
   static domain_name_servers=192.168.0.1
```

statt eth0 geht auch wlan0 zusätzlich für den wifi Stick. Die /etc/network/interfaces
Konfiguration, die landläufig empfohlen wird, geht unter Debian Jessie nicht mehr.

---

###Startup-Script einrichten

Siehe Linux Config für systemd

---

###USB Soundkarte einrichten

sudo nano /usr/share/alsa/alsa.conf

Folgende Zeilen ändern:

defaults.ctl.card 0
defaults.pcm.card 0

in:

defaults.ctl.card 1
defaults.pcm.card 1

Danach reboot und das Soundvolumen anpassen per Befehl: alsamixer

Wav Dateien spielen:
aplay /home/pi/Music/gong.wav

Mp3 Dateien spielen:
sudo apt-get -y install mpg321
mpg321 /home/pi/Music/siren.mp3

Siehe auch (vorsicht: da alte und mittlerweile nicht mehr gültige Config-Datei):
http://computers.tutsplus.com/articles/using-a-usb-audio-device-with-a-raspberry-pi--mac-55876

---

###Server Installation:

	apt-get install libkrb5-dev
	npm install -g node-gyp 
	für npm install mongo

---

###Install Guide LCD Display:
	for: SainSmart IIC/I2C/TWI Serial 2004 Character 20x4 LCD Display Modul 
	https://www.auctoritas.ch/bauprojekte/4-ein-sainsmart-lcd-display-am-raspberry-pi-verwenden
	"i2cdetect 1" instead of "i2cdetect -y 1"
	
---

###Camera

* https://www.raspberrypi.org/documentation/usage/camera/raspicam/raspivid.md
* https://www.raspberrypi.org/documentation/raspbian/applications/camera.md
* http://jankarres.de/2013/05/raspberry-pi-raspistill-und-raspivid-parameter/
* http://raspberrypiguide.de/howtos/raspberry-pi-camera-how-to/