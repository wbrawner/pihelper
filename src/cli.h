/**
 * Copyright © 2019, 2020 William Brawner.
 *
 * This file is part of PiHelper.
 *
 * PiHelper is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * PiHelper is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with PiHelper.  If not, see <https://www.gnu.org/licenses/>.
 */
#include <getopt.h>
#include "pihelper.h"

static char * shortopts = "cd::ef:hqv";

static struct option longopts[] = {
        { "configure",  no_argument,            NULL,           'c' },
        { "disable",    optional_argument,      NULL,           'd' },
        { "enable",     no_argument,            NULL,           'e' },
        { "file",       required_argument,      NULL,           'f' },
        { "help",       no_argument,            NULL,           'h' },
        { "quiet",      no_argument,            NULL,           'q' },
        { "verbose",    no_argument,            NULL,           'v' }
};

void print_usage();

pihole_config * configure_pihole(char * config_path);

