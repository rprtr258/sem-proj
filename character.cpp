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
    m_boundingBox = QRect(m_coord.x(), m_coord.y(), 55, 85);
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
    if (m_map->isFilled(m_boundingBox.translated(0, 1)))
        m_vspeed = 30;
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

void Character::attack(qint32 mouseX, qint32 mouseY) {
    if (m_reload == 0 and m_mana >= m_weapon->getManaCost()) {
        m_reload = 20;
        setMana(m_mana - m_weapon->getManaCost());
        QVector2D startCoord = getHandPosition();
        m_weapon->shoot(m_view, QVector2D(mouseX, mouseY), startCoord, m_map, m_id);
    }
}

void Character::hit(qreal value) {
    m_health = std::max(0.0, m_health - value);
}

bool Character::update() {
    m_health = std::min(m_health + 0.1, 100.0);
    setMana(std::min(m_mana + 1, 100));
    m_vspeed = std::max(m_vspeed - 1, 0);
    m_reload = std::max(m_reload - 1, 0);

    if (m_goingLeft xor m_goingRight) {
        if (m_goingLeft) {
            if (not m_spriteFlipped)
                flipSprite();
            moveHorizontal(-5);
        }
        if (m_goingRight) {
            if (m_spriteFlipped)
                flipSprite();
            moveHorizontal(5);
        }
    }
    m_inAir = (not m_map->isFilled(m_boundingBox.translated(0, 1)));
    moveVertical(10 - m_vspeed);

    m_item->setPosition(m_coord);
    m_item->setProperty("mirrored", m_spriteFlipped);
    m_item->setProperty("going", m_goingLeft xor m_goingRight);
    m_item->setProperty("inAir", m_inAir);
    m_item->setProperty("health", m_health);
    m_item->setProperty("mana", m_mana);
    m_item->setProperty("attack", m_reload != 0);
    return false;
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
    const int offsetX = 8;
    const int offsetY = 25;

    if (m_spriteFlipped)
        return QVector2D(m_coord.x() + offsetX, m_coord.y() + offsetY);
    else
        return QVector2D(m_coord.x() + 55 - offsetX, m_coord.y() + offsetY);
}
