#include "virra.h"

char *___lltostr(long long x) {
  int length = snprintf(NULL, 0, "%lld", x) + 1;
  char *ret = malloc(length);
  snprintf(ret, length, "%lld", x);
  return ret;
}

char *___booltostr(bool b) {
  return b ? "true" : "false"; 
}