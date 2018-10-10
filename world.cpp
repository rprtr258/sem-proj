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
