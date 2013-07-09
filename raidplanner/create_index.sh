#!/bin/sh

echo 'Generating index.html...'
sed 's/<?php[^?>]*?>//g' ui.tmpl > index.html
