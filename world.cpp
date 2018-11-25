#include "bullet.h"
#include "world.h"
#include "projectile.h"
#include "gun.h"
#include "lasergun.h"
#include "grenadegun.h"

World::World(Observer *view) : m_view(view) {
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
        case (Qt::Key_Space): {
            m_player->stopJump();
            break;
        }
    }
}

void World::click(qint32 mouseX, qint32 mouseY) {
    //Weapon *weapon = new Gun();
    Weapon *weapon = new LaserGun();
    //Weapon *weapon = new GrenadeGun();
    QVector2D startCoord = weapon->getStartCoord(m_player->getBoundingBox().width(), m_player->flipped(), m_player->getVector2D());
    Projectile *projectile = weapon->shoot(m_view, QVector2D(mouseX, mouseY), startCoord, &m_map);
    m_updateList.push_back(projectile);
}

void World::update() {
    if (m_player == nullptr) {
        QQuickItem *playerItem = m_view->createPlayer(170, 0);
        m_player = new Player(m_map, playerItem);
        m_updateList.push_back(m_player);
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
}
