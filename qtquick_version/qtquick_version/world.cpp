#include "world.h"

World::World() {
    m_player = new Player(m_map);
    m_map.fillRectangle(0, 0, 20, 480);
    m_map.fillRectangle(0, 300, 100, 20);
    m_map.fillRectangle(620, 0, 20, 480);
    m_map.fillRectangle(0, 460, 640, 20);
    m_map.fillRectangle(200, 200, 100, 20);
}

World::~World() {
    delete m_player;
}

void World::keyPressEvent(qint32 key) {
    if (m_keyPressMap[key])
        return;
    m_keyPressMap[key] = true;
    switch (key) {
        case (Qt::Key_A): {
            if (not m_keyPressMap[Qt::Key_D])
                m_player->goLeft();
            break;
        }
        case (Qt::Key_D): {
            if (not m_keyPressMap[Qt::Key_A])
                m_player->goRight();
            break;
        }
        case (Qt::Key_Space): {
            m_player->jump();
            break;
        }
    }
}

void World::keyReleaseEvent(qint32 key) {
    m_keyPressMap[key] = false;
    switch (key) {
        case (Qt::Key_A): {
            m_player->stopLeft();
            if (m_keyPressMap[Qt::Key_D])
                m_player->goRight();
            break;
        }
        case (Qt::Key_D): {
            m_player->stopRight();
            if (m_keyPressMap[Qt::Key_A])
                m_player->goLeft();
            break;
        }
        case (Qt::Key_Space): {
            m_player->stopJump();
            break;
        }
    }
}

void World::setPlayerItem(QObject *playerItem) {
    m_player->setItem(playerItem);
}

void World::update() {
    m_player->update();
}
