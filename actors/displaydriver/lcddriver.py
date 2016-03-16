# slightly improved version of lcddriver.py
# from http://www.raspberrypi.org/phpBB3/viewtopic.php?f=32&t=34261&p=378524
# by way of http://www.recantha.co.uk/blog/?p=4849

# main addition :
# a named var to display_string() (bl, for backlight, defaults to 1)
# percolates all the way through to lcd_write, lcd_write_four_bits and lcd_strobe

# this allows to write to the screen with backlight on or off, explicitly or by
# passing a state variable
# also applies to clear()

# minor changes :
# more compact notations instead of some if/else constructs
# removed lcd_ prefix from "end-user" functions display_string, clear, backlight
# these are already prefixed with 'lcd.' in actual code anyway.

import i2c_lib
from time import *

# LCD Address
ADDRESS = 0x27

# commands
LCD_CLEARDISPLAY = 0x01
LCD_RETURNHOME = 0x02
LCD_ENTRYMODESET = 0x04
LCD_DISPLAYCONTROL = 0x08
LCD_CURSORSHIFT = 0x10
LCD_FUNCTIONSET = 0x20
LCD_SETCGRAMADDR = 0x40
LCD_SETDDRAMADDR = 0x80

# flags for display entry mode
LCD_ENTRYRIGHT = 0x00
LCD_ENTRYLEFT = 0x02
LCD_ENTRYSHIFTINCREMENT = 0x01
LCD_ENTRYSHIFTDECREMENT = 0x00

# flags for display on/off control
LCD_DISPLAYON = 0x04
LCD_DISPLAYOFF = 0x00
LCD_CURSORON = 0x02
LCD_CURSOROFF = 0x00
LCD_BLINKON = 0x01
LCD_BLINKOFF = 0x00

# flags for display/cursor shift
LCD_DISPLAYMOVE = 0x08
LCD_CURSORMOVE = 0x00
LCD_MOVERIGHT = 0x04
LCD_MOVELEFT = 0x00

# flags for function set
LCD_8BITMODE = 0x10
LCD_4BITMODE = 0x00
LCD_2LINE = 0x08
LCD_1LINE = 0x00
LCD_5x10DOTS = 0x04
LCD_5x8DOTS = 0x00

# flags for backlight control
LCD_BACKLIGHT = 0x08
LCD_NOBACKLIGHT = 0x00

En = 0b00000100 # Enable bit
Rw = 0b00000010 # Read/Write bit
Rs = 0b00000001 # Register select bit

class lcd:
   #initializes objects and lcd
   def __init__(self):
      self.lcd_device = i2c_lib.i2c_device(ADDRESS)

      self.lcd_write(0x03)
      self.lcd_write(0x03)
      self.lcd_write(0x03)
      self.lcd_write(0x02)

      self.lcd_write(LCD_FUNCTIONSET | LCD_2LINE | LCD_5x8DOTS | LCD_4BITMODE)
      self.lcd_write(LCD_DISPLAYCONTROL | LCD_DISPLAYON)
      self.lcd_write(LCD_CLEARDISPLAY)
      self.lcd_write(LCD_ENTRYMODESET | LCD_ENTRYLEFT)
      sleep(0.2)

   # clocks EN to latch command
   def lcd_strobe(self, data, bl=1):
      self.lcd_device.write_cmd(data | En | (LCD_NOBACKLIGHT,LCD_BACKLIGHT)[bl])
      sleep(.0005)
      self.lcd_device.write_cmd(((data & ~En) | (LCD_NOBACKLIGHT,LCD_BACKLIGHT)[bl]))
      sleep(.0001)

   def lcd_write_four_bits(self, data, bl=1):
      self.lcd_device.write_cmd(data | (LCD_NOBACKLIGHT,LCD_BACKLIGHT)[bl])
      self.lcd_strobe(data, bl=bl)

   # write a command to lcd
   def lcd_write(self, cmd, mode=0, bl=1):
      self.lcd_write_four_bits(mode | (cmd & 0xF0), bl=bl)
      self.lcd_write_four_bits(mode | ((cmd << 4) & 0xF0), bl=bl)

   # put string function
   def display_string(self, string, line, bl=1):
      self.lcd_write( (0x80, 0x80, 0xC0, 0x94, 0xD4, )[line], bl=bl)
      for char in string:
         self.lcd_write(ord(char), Rs, bl=bl)

   # clear lcd and set to home
   def clear(self, bl=1):
      self.lcd_write(LCD_CLEARDISPLAY, bl=bl)
      self.lcd_write(LCD_RETURNHOME, bl=bl)

   # turn backlight on and off
   def backlight(self, state): # state: 1 = on, 0 = off
      self.lcd_device.write_cmd( (LCD_NOBACKLIGHT,LCD_BACKLIGHT)[state])