#include "./hardware.h"

#include "../event/event_loop.h"
#include "../lib/duktape/duktape.h"
#include <Arduino.h>

static duk_ret_t impl_runtime_native_hardware_pinmode(duk_context *ctx) {
  int pin = duk_require_int(ctx, 0);
  int mode = duk_require_int(ctx, 1);

  pinMode(pin, mode);

  return 0;
}

static duk_ret_t impl_runtime_native_hardware_dwrite(duk_context *ctx) {
  int pin = duk_require_int(ctx, 0);
  int state = duk_require_int(ctx, 1);

  digitalWrite(pin, state);

  return 0;
}

static duk_ret_t impl_runtime_native_hardware_dread(duk_context *ctx) {
  int pin = duk_require_int(ctx, 0);

  int value = digitalRead(pin);
  duk_push_int(ctx, value);

  return 1;
}

static duk_ret_t impl_runtime_native_hardware_dpulsein(duk_context *ctx) {
  int pin = duk_require_int(ctx, 0);
  int state = duk_require_int(ctx, 1);

  int value = pulseIn(pin, state);
  duk_push_int(ctx, value);

  return 1;
}

struct PinState {
  int lastState;
  int pin;
  int id;
  bool once;
};

#define MAX_PINS 128
PinState pins[MAX_PINS] = {};
int pinCount = 0;

static duk_ret_t impl_runtime_native_hardware_devton_low(duk_context *ctx) {
  // Second argument, first is event name
  int pin = duk_require_int(ctx, 1);

  PinState pinState = {
      .lastState = digitalRead(pin), .pin = pin, .id = -1, .once = true};

  uint8_t id = event_loop_create_duktape_event(
      [](uint8_t eId) -> bool {
        int pinIndex = -1;

        for (int i = 0; i < MAX_PINS; i++) {
          if (pins[i].id == eId) {
            pinIndex = i;
            break;
          }
        }

        int currentState = digitalRead(pins[pinIndex].pin);

        if (currentState == LOW && pins[pinIndex].lastState == HIGH) {
          pins[pinIndex].lastState = currentState;
          return true;
        } else {
          pins[pinIndex].lastState = currentState;
        }

        return false;
      },
      ctx);

  pins[pinCount].id = id;

  pinCount++;

  duk_push_int(ctx, id);

  return 1;
}

static duk_ret_t impl_runtime_native_hardware_devton_high(duk_context *ctx) {
  // Second argument, first is event name
  int pin = duk_require_int(ctx, 1);

  PinState pinState = {
      .lastState = digitalRead(pin), .pin = pin, .id = -1, .once = true};

  uint8_t id = event_loop_create_duktape_event(
      [](uint8_t eId) -> bool {
        int pinIndex = -1;

        for (int i = 0; i < MAX_PINS; i++) {
          if (pins[i].id == eId) {
            pinIndex = i;
            break;
          }
        }

        int currentState = digitalRead(pins[pinIndex].pin);

        if (currentState == HIGH && pins[pinIndex].lastState == LOW) {
          pins[pinIndex].lastState = currentState;
          return true;
        } else {
          pins[pinIndex].lastState = currentState;
        }

        return false;
      },
      ctx);

  pins[pinCount].id = id;

  pinCount++;

  duk_push_int(ctx, id);

  return 1;
}

static duk_ret_t impl_runtime_native_hardware_devton(duk_context *ctx) {
  const char *event = duk_require_string(ctx, 0);

  if (strcmp(event, "low") == 0) {
    return impl_runtime_native_hardware_devton_low(ctx);
  } else if (strcmp(event, "high") == 0) {
    return impl_runtime_native_hardware_devton_high(ctx);
  }

  return 0;
}

void register_runtime_native_hardware(duk_context *ctx) {
  duk_push_object(ctx);

  duk_push_c_function(ctx, impl_runtime_native_hardware_pinmode, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "setMode");

  duk_push_c_function(ctx, impl_runtime_native_hardware_dwrite, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "setState");

  duk_push_c_function(ctx, impl_runtime_native_hardware_dread, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "getState");

  duk_push_c_function(ctx, impl_runtime_native_hardware_dpulsein, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "measurePulse");

  duk_push_c_function(ctx, impl_runtime_native_hardware_devton, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "devton");

  duk_put_global_string(ctx, "$__native_hardware_board");
}