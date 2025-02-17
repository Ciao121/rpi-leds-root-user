"use strict";

var exec = require('sync-exec');
var _ = require('lodash');

/**
 * Mapping of LED name to raspberry pi reference
 * @type {Object}
 */
var LED_NAMES = {
  power: 'PWR',
  status: 'ACT'
};

var COMMANDS = {
  init: 'echo gpio | tee /sys/class/leds/<%= led %>/trigger',
  turnOn: 'echo 1 | tee /sys/class/leds/<%= led %>/brightness',
  turnOff: 'echo 0 | tee /sys/class/leds/<%= led %>/brightness',
  heartbeat: 'echo heartbeat | tee /sys/class/leds/<%= led %>/trigger',
  blink: 'echo timer | tee /sys/class/leds/<%= led %>/trigger',

  // NOTE: Change to `input`
  resetPower: 'echo input | tee /sys/class/leds/led1/trigger',
  // NOTE: Change to `mmc0`
  resetStatus: 'echo mmc0 | tee /sys/class/leds/led0/trigger'
};

/**
 * Generate command
 * @param {String} led Led name. `power` or `status`
 * @param {String} cmdName Command name. See `COMMANDS`
 * @return {String} Command string
 */
var generateCommand = function(led, cmdName) {
  var ledName = LED_NAMES[led];
  if (!ledName) { throw('Invalid led:', led); }

  var command = COMMANDS[cmdName];
  var output = _.template(command)({
    led: ledName
  });

  return output;
};

var generateResetCommand = function(cmdName) {
  var command = COMMANDS[cmdName];
  var output = _.template(command)();

  return output;
};

var leds = function() {
  exec(generateCommand('power', 'init'));
  exec(generateCommand('status', 'init'));
};

/**
 * Generate methods for all LEDs
 */
_.each(_.keys(LED_NAMES), function(led) {
  leds.prototype[led] = {
    turnOn: function() {
      exec(generateCommand(led, 'turnOn'));
    },
    turnOff: function() {
      exec(generateCommand(led, 'turnOff'));
    },
    heartbeat: function() {
      exec(generateCommand(led, 'heartbeat'));
    },
    blink: function() {
      exec(generateCommand(led, 'blink'));
    }
  };
});

leds.prototype.power.reset = function() {
  exec(generateResetCommand('resetPower'));
};

leds.prototype.status.reset = function() {
  exec(generateResetCommand('resetStatus'));
};

leds.prototype.reset = function() {
  this.power.reset();
  this.status.reset();
};

module.exports = leds;
