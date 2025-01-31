#include "./event_loop.h"

#include "../lib/duktape/duktape.h"
#include <Arduino.h>

#define MAX_EVENTS 255
Event events[MAX_EVENTS] = {};
uint8_t eventCount = 0;

uint8_t eventloop_create_event(bool (*checkFunction)(uint8_t eId),
                               void (*callback)(uint8_t eId)) {
  if (eventCount >= MAX_EVENTS) {
    return 255; // Error code for full array
  }

  Event event = {
      .id = eventCount,
      .checkFunction = checkFunction,
      .callback = callback,
  };

  events[eventCount] = event;
  eventCount++;

  return event.id;
}

void eventloop_remove_event(uint8_t id) {
  for (uint8_t i = 0; i < eventCount; i++) {
    if (events[i].id == id) {
      for (uint8_t j = i; j < eventCount - 1; j++) {
        events[j] = events[j + 1];
      }

      eventCount--;
      break;
    }
  }
}

void eventloop_tick() {
  for (uint8_t i = 0; i < eventCount; i++) {
    if (events[i].checkFunction(events[i].id)) {
      events[i].callback(events[i].id);
    }
  }
}

static duk_context *current_ctx = nullptr;

static void duktape_event_callback(uint8_t eId) {
  Event *current_event;

  for (uint8_t i = 0; i < eventCount; i++) {
    if (events[i].id == eId) {
      current_event = &events[i];
      break;
    }
  }

  duk_context *ctx = current_event->ctx; // Use the event's context

  if (duk_peval_string(ctx, (String("$__native_events_fire(") +
                             String(current_event->id) + ")")
                                .c_str()) != 0) {
    Serial.println(duk_safe_to_string(ctx, -1));
  }

  duk_pop(ctx);
}

uint8_t event_loop_create_duktape_event(bool (*checkFunction)(uint8_t eId),
                                        duk_context *ctx) {
  Event event = {
      .id = eventCount,
      .checkFunction = checkFunction,
      .callback = duktape_event_callback,
      .ctx = ctx // Store the context with the event
  };

  if (eventCount >= MAX_EVENTS) {
    return 255;
  }

  events[eventCount] = event;
  eventCount++;

  return event.id;
}