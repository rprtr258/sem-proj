#include "player.h"
#include "gun.h"
#include "lasergun.h"
#include "grenadegun.h"

qint32 sign(const qint32 &x) {
    return (x > 0) - (x < 0);
}

Player::Player(Map *map, Observer *view, QQuickItem *item, QPoint position) : m_map(map), m_view(view) {
    m_item = item;
    m_health = 100;
    m_mana = 100;
    m_goingLeft = m_goingRight = false;
    m_jumping = false;
    m_vspeed = 0;
    //m_xCoord = position.x();
    //m_yCoord = position.y();
    coord = position;
    m_reload = 0;
    m_weapon = new Gun();
    m_weaponType = 0;
    m_boundingBox = QRect(coord.x() + 17, coord.y() + 4, 24, 85);
    m_spriteFlipped = false;
}

Player::~Player() {
    delete m_weapon;
}

void Player::goLeft() {
    m_goingLeft = true;
}

void Player::stopLeft() {
    m_goingLeft = false;
}

void Player::goRight() {
    m_goingRight = true;
}

void Player::stopRight() {
    m_goingRight = false;
}

void Player::jump() {
    m_jumping = true;
}

void Player::stopJump() {
    m_jumping = false;
}

void Player::changeWeapon() {
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

Projectile* Player::attack(qint32 mouseX, qint32 mouseY) {
    if (m_reload == 0) {
        m_reload = 25;
        QVector2D startCoord = getHandPosition();
        return m_weapon->shoot(m_view, QVector2D(mouseX, mouseY), startCoord, m_map);
    }
    return nullptr;
}

bool Player::update() {
    setHealth(((m_health + (rand() % 2 ? 1 : -1)) % 101 + 101) % 101);
    setMana(((m_health + (rand() % 2 ? 1 : -1)) % 101 + 101) % 101);
    if (m_goingLeft != m_goingRight) {
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
    if (m_jumping and m_map->isFilled(m_boundingBox.translated(0, 1))) {
        m_inAir = true;
        m_vspeed = 30;
    } else if (!m_jumping and m_map->isFilled(m_boundingBox.translated(0, 1))) {
        m_inAir = false;
    }
    moveVertical(10 - m_vspeed);
    m_vspeed = std::max(m_vspeed - 1, 0);
    m_reload = std::max(m_reload - 1, 0);

//    m_item->setX(m_xCoord);
//    m_item->setY(m_yCoord);
    m_item->setX(coord.x());
    m_item->setY(coord.y());
    m_item->setProperty("mirrored", m_spriteFlipped);
    m_item->setProperty("going", m_goingLeft xor m_goingRight);
    m_item->setProperty("inAir", m_inAir);
    m_item->setProperty("health", m_health);
    m_item->setProperty("mana", m_mana);
    m_item->setProperty("attack", m_reload != 0);
    return false;
}

void Player::moveHorizontal(qint32 speed) {
    qint32 dx = speed;
    qint32 delta = sign(speed);
    QRect newRect = m_boundingBox.translated(dx, 0);
    while (m_map->isFilled(newRect) and dx != 0) {
        dx -= delta;
        newRect.translate(-delta, 0);
    }
    if (dx == 0)
        return;
    //setX(m_xCoord + dx);
    coord.setX(coord.x() + dx);

    m_boundingBox.translate(dx, 0);
}

void Player::moveVertical(qint32 speed) {
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
    //setY(m_yCoord + dy);
    coord.setY(coord.y() + dy);
    m_boundingBox.translate(0, dy);
}

QVector2D Player::getHandPosition() {
    const int ofsetX = 47;
    const int ofsetY = 25;

    if (m_spriteFlipped) {
        //return QVector2D(m_xCoord - ofsetX, m_yCoord + ofsetY);
        return QVector2D(coord.x() - ofsetX, coord.y() + ofsetY);
    } else {
        //return QVector2D(m_xCoord + ofsetX, m_yCoord + ofsetY);
        return QVector2D(coord.x() + ofsetX, coord.y() + ofsetY);

    }
}
