#include "./timers.h"

#include "../event/event_loop.h"
#include "../lib/duktape/duktape.h"

#include <Arduino.h>

struct Timer {
  int lastState;
  int timeout;
  int id;
  bool once;
};

#define MAX_TIMERS 128

Timer timers[MAX_TIMERS] = {};
int timerCount = 0;

static duk_ret_t impl_runtime_native_timers_setinterval(duk_context *ctx) {
  int lastState = millis();
  int timeout = duk_require_int(ctx, 0);

  Timer timer = {
      .lastState = lastState, .timeout = timeout, .id = -1, .once = true};

  timers[timerCount] = timer;

  uint8_t id = event_loop_create_duktape_event(
      [](uint8_t eId) -> bool {
        int timerIndex = -1;

        for (int i = 0; i < MAX_TIMERS; i++) {
          if (timers[i].id == eId) {
            timerIndex = i;
            break;
          }
        }

        unsigned long currentTime = millis();

        if (currentTime - timers[timerIndex].lastState >=
            timers[timerIndex].timeout) {
          timers[timerIndex].lastState = currentTime;
          return true;
        }

        return false;
      },
      ctx);

  timers[timerCount].id = id;

  timerCount++;

  duk_push_int(ctx, id);

  return 1;
}

static duk_ret_t impl_runtime_native_timers_clear(duk_context *ctx) {
  int id = duk_require_int(ctx, 0);

  for (int i = 0; i < timerCount; i++) {
    if (timers[i].id == id) {
      eventloop_remove_event(id);

      timers[i] = timers[timerCount - 1];
      timers[timerCount - 1].id = -1;

      timerCount--;
      break;
    }
  }

  return 0;
}

static duk_ret_t impl_runtime_native_timers_blockingdelay(duk_context *ctx) {
  int timeout = duk_require_int(ctx, 0);

  delay(timeout);

  return 0;
}

static duk_ret_t
impl_runtime_native_timers_blockingdelaymicro(duk_context *ctx) {
  int timeout = duk_require_int(ctx, 0);

  delayMicroseconds(timeout);

  return 0;
}

void register_runtime_native_timers(duk_context *ctx) {
  duk_push_object(ctx);

  duk_push_c_function(ctx, impl_runtime_native_timers_setinterval, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "setInterval");

  duk_push_c_function(ctx, impl_runtime_native_timers_clear, DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "clear");

  duk_push_c_function(ctx, impl_runtime_native_timers_blockingdelay,
                      DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "delay");

  duk_push_c_function(ctx, impl_runtime_native_timers_blockingdelaymicro,
                      DUK_VARARGS);
  duk_put_prop_string(ctx, -2, "delayMicro");

  duk_put_global_string(ctx, "$__native_timers");
}