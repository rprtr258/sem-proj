#include "character.h"
#include "gun.h"
#include "lasergun.h"
#include "grenadegun.h"

qint32 sign(const qint32 &x) {
    return (x > 0) - (x < 0);
}

Character::Character(Map *map, Observer *view, QQuickItem *item, QPoint position) : m_map(map), m_view(view) {
    m_item = item;
    m_health = 100;
    m_mana = 100;
    m_goingLeft = m_goingRight = false;
    m_jumping = false;
    m_vspeed = 0;
    m_coord = position;
    m_reload = 0;
    m_weapon = new Gun();
    m_weaponType = 0;
    m_boundingBox = QRect(m_coord.x() + 17, m_coord.y() + 4, 24, 85);
    m_spriteFlipped = false;
}

Character::~Character() {
    delete m_weapon;
}

void Character::goLeft() {
    m_goingLeft = true;
}

void Character::stopLeft() {
    m_goingLeft = false;
}

void Character::goRight() {
    m_goingRight = true;
}

void Character::stopRight() {
    m_goingRight = false;
}

void Character::jump() {
    m_jumping = true;
}

void Character::stopJump() {
    m_jumping = false;
}

void Character::changeWeapon() {
    delete m_weapon;
    m_weaponType = (m_weaponType + 1) % 3;
    switch (m_weaponType) {
        case 0: {
            m_weapon = new Gun();
            break;
        }
        case 1: {
            m_weapon = new LaserGun();
            break;
        }
        case 2: {
            m_weapon = new GrenadeGun();
            break;
        }
    }
}

Projectile* Character::attack(qint32 mouseX, qint32 mouseY) {
    if (m_reload == 0) {
        m_reload = 25;
        QVector2D startCoord = getHandPosition();
        return m_weapon->shoot(m_view, QVector2D(mouseX, mouseY), startCoord, m_map);
    }
    return nullptr;
}

void Character::moveHorizontal(qint32 speed) {
    qint32 dx = speed;
    qint32 delta = sign(speed);
    QRect newRect = m_boundingBox.translated(dx, 0);
    while (m_map->isFilled(newRect) and dx != 0) {
        dx -= delta;
        newRect.translate(-delta, 0);
    }
    if (dx == 0)
        return;
    m_coord.setX(m_coord.x() + dx);
    m_boundingBox.translate(dx, 0);
}

void Character::moveVertical(qint32 speed) {
    qint32 dy = speed;
    qint32 delta = sign(speed);
    QRect newRect = m_boundingBox.translated(0, dy);
    while (m_map->isFilled(newRect) and dy != 0) {
        dy -= delta;
        newRect.translate(0, -delta);
        m_vspeed = 0;
    }
    if (dy == 0)
        return;
    m_inAir = true;
    m_coord.setY(m_coord.y() + dy);
    m_boundingBox.translate(0, dy);
}

QVector2D Character::getHandPosition() {
    //const int ofsetX = 47;
    //const int ofsetY = 25;
    const int offsetX1 = 47;
    const int offsetX2 = 8;
    const int offsetY = 25;

    if (m_spriteFlipped) {
        //return QVector2D(m_xCoord - ofsetX, m_yCoord + ofsetY);
        return QVector2D(m_coord.x() + offsetX2, m_coord.y() + offsetY);
    } else {
        //return QVector2D(m_xCoord + ofsetX, m_yCoord + ofsetY);
        return QVector2D(m_coord.x() + offsetX1, m_coord.y() + offsetY);
    }
}
