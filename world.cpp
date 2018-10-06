#include "world.h"

World::World() {
    player = new Player(map);
    map.fillRectangle(0, 0, 20, 480);
    map.fillRectangle(620, 0, 640, 480);
}

World::~World() {
    delete player;
}

void World::keyPressEvent(QKeyEvent *event) {
    if (event->key() == Qt::Key_A) {
        player->goLeft();
    } else if (event->key() == Qt::Key_D) {
        player->goRight();
    }
}

void World::draw(QPainter *painter) {
    map.draw(painter);
    player->draw(painter);
}
