#include "world.h"

World::World() {
    player = new Player(map);
    map.fillRectangle(0, 0, 20, 480);
    map.fillRectangle(0, 300, 100, 320);
    map.fillRectangle(620, 0, 640, 480);
    map.fillRectangle(0, 460, 640, 480);
}

World::~World() {
    delete player;
}

void World::keyPressEvent(int key) {
    if (isKeyPressed[key])
        return;
    isKeyPressed[key] = true;
    switch (key) {
        case (Qt::Key_A): {
            if (not isKeyPressed[Qt::Key_D])
                player->goLeft();
            break;
        }
        case (Qt::Key_D): {
            if (not isKeyPressed[Qt::Key_A])
                player->goRight();
            break;
        }
        case (Qt::Key_Space): {
            player->jump();
            break;
        }
    }
}

void World::keyReleaseEvent(int key) {
    isKeyPressed[key] = false;
    switch (key) {
        case (Qt::Key_A): {
            player->stopLeft();
            if (isKeyPressed[Qt::Key_D])
                player->goRight();
            break;
        }
        case (Qt::Key_D): {
            player->stopRight();
            if (isKeyPressed[Qt::Key_A])
                player->goLeft();
            break;
        }
        case (Qt::Key_Space): {
            player->stopJump();
            break;
        }
    }
}

void World::update() {
    player->update();
}
