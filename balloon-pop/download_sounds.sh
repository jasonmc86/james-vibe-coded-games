#!/bin/bash

# Create sounds directory if it doesn't exist
mkdir -p sounds

# Download real animal sound files
curl -o sounds/cow.mp3 https://www.soundjay.com/animals/cow-moo-1.mp3
curl -o sounds/dog.mp3 https://www.soundjay.com/animals/dog-barking-1.mp3
curl -o sounds/cat.mp3 https://www.soundjay.com/animals/cat-meow-1.mp3
curl -o sounds/duck.mp3 https://www.soundjay.com/animals/duck-quacking-1.mp3
curl -o sounds/frog.mp3 https://www.soundjay.com/animals/frog-1.mp3
curl -o sounds/rooster.mp3 https://www.soundjay.com/animals/rooster-1.mp3

# Make the script executable
chmod +x download_sounds.sh 