#include "bullet.h"
#include "world.h"
#include "projectile.h"
#include "gun.h"
#include "lasergun.h"
#include "grenadegun.h"

World::World(Bridge *view) : m_view(view) {
    m_map.fillRectangle(-40, 0, 20, 480); // left wall
    m_map.fillRectangle(660, 0, 20, 480); // right wall
    m_map.fillRectangle(-40, 460, 680, 20); // bottom wall
    m_map.fillRectangle(-20, 274, 188, 10); // left platform
    m_map.fillRectangle(473, 274, 187, 10); // right platform
    m_map.fillRectangle(256, 113, 128, 20); // top platform
    m_map.fillRectangle(310, 132, 20, 150); // central platform
}

World::~World() {
    delete m_player;
    delete m_bot;
}

void World::keyPressEvent(qint32 key) {
    if (isKeyPressed[key])
        return;
    isKeyPressed[key] = true;
    switch (key) {
        case (Qt::Key_A): {
            m_player->goLeft();
            break;
        }
        case (Qt::Key_D): {
            m_player->goRight();
            break;
        }
        case (Qt::Key_Space): {
            m_player->jump();
            break;
        }
        case (Qt::Key_Tab): {
            m_player->changeWeapon();
            break;
        }
    }
}

void World::keyReleaseEvent(qint32 key) {
    isKeyPressed[key] = false;
    switch (key) {
        case (Qt::Key_A): {
            m_player->stopLeft();
            break;
        }
        case (Qt::Key_D): {
            m_player->stopRight();
            break;
        }
    }
}

void World::click(qint32 mouseX, qint32 mouseY) {
    m_player->attack(mouseX, mouseY);
}

void World::addToUpdateList(Creature *creature) {
    m_updateList.push_back(creature);
}

void World::update() {
    if (m_player == nullptr) {
        QPoint position(0, 0);
        QQuickItem *playerItem = m_view->createCharacter(position.x(), position.y(), 0);
        m_player = new Player(&m_map, m_view, playerItem, position);
        m_updateList.push_back(m_player);
        m_map.addMarkedPoint("player", m_player->getPosition());
    }

    if (m_bot == nullptr) {
        QPoint position(500, 0);
        QQuickItem *botItem = m_view->createCharacter(position.x(), position.y(), 1);
        m_bot = new Bot(&m_map, m_view, botItem, position);
        m_updateList.push_back(m_bot);
    }

    for (Creature *creature : m_updateList) {
        creature->affect(m_player);
        creature->affect(m_bot);
    }

    QVector<qint32> deleteList;
    for (qint32 i = 0; i < m_updateList.size(); i++) {
        Creature *creature = m_updateList[i];
        if (creature->update())
            deleteList.push_back(i);
    }
    for (auto it = deleteList.rbegin(); it != deleteList.rend(); it++) {
        delete m_updateList[*it];
        m_updateList.remove(*it);
    }
    if (m_player->getHealth() <= 0.2 or m_bot->getHealth() <= 0.2) {
        if (m_player->getHealth() <= 0.2)
            m_bot->addKill();
        else
            m_player->addKill();
        m_player->respawn(0, 0);
        m_bot->respawn(500, 0);
    }
}
