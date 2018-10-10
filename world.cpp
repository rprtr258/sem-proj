#include "world.h"

World::World() {
    player = new Player(map);
    map.fillRectangle(0, 0, 20, 480);
    map.fillRectangle(620, 0, 640, 480);
    map.fillRectangle(0, 460, 640, 480);
}

World::~World() {
    delete player;
}

void World::keyPressEvent(QKeyEvent *event) {
    if (isKeyPressed[event->key()])
        return;
    if ((isKeyPressed[Qt::Key_A] and event->key() == Qt::Key_D) or
        (isKeyPressed[Qt::Key_D] and event->key() == Qt::Key_A))
        return;
    isKeyPressed[event->key()] = true;
    switch (event->key()) {
        case (Qt::Key_A): {
            player->goLeft();
            break;
        }
        case (Qt::Key_D): {
            player->goRight();
            break;
        }
    }
}

void World::keyReleaseEvent(QKeyEvent *event) {
    isKeyPressed[event->key()] = false;
    switch (event->key()) {
        case (Qt::Key_A): {
            player->stopLeft();
            break;
        }
        case (Qt::Key_D): {
            player->stopRight();
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
