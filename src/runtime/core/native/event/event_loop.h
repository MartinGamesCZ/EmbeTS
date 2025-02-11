#ifndef EMBETS_EVENTLOOP
#define EMBETS_EVENTLOOP

#include "../lib/duktape/duktape.h"

typedef struct {
  uint8_t id;
  bool (*checkFunction)(uint8_t eId);
  void (*callback)(uint8_t eId);
  duk_context *ctx; // Add this field
} Event;

uint8_t eventloop_create_event(bool (*checkFunction)(uint8_t eId),
                               void (*callback)(uint8_t eId));
void eventloop_tick();
void eventloop_remove_event(uint8_t id);
uint8_t event_loop_create_duktape_event(bool (*checkFunction)(uint8_t eId),
                                        duk_context *ctx);

#endif