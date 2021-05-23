#include <stdio.h>
#include <stdbool.h>
#include <stdlib.h>
#include "./virra.h"

int main() {
const char test = -111;
bool no = false;
printf("yes\n");
const char* schtring = "a string\n";
printf(schtring);
printf(___lltostr(test));
printf("\v");
printf(___booltostr(no));

return 0;
}