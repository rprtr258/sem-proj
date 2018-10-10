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

void World::keyPressEvent(QKeyEvent *event) {
    if (isKeyPressed[event->key()])
        return;
    isKeyPressed[event->key()] = true;
    switch (event->key()) {
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

void World::keyReleaseEvent(QKeyEvent *event) {
    isKeyPressed[event->key()] = false;
    switch (event->key()) {
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

void World::draw(QPainter *painter) {
    map.draw(painter);
    player->draw(painter);
}
