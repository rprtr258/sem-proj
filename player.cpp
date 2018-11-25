#include "player.h"

qint32 sign(const qint32 &x) {
    return (x > 0) - (x < 0);
}

Player::Player(Map &worldMap, QQuickItem *item) {
    m_item = item;
    m_health = 100;
    m_goingLeft = m_goingRight = false;
    m_jumping = false;
    m_vspeed = 0;
    m_xCoord = 170;
    m_yCoord = 0;
    m_map = &worldMap;
    m_reload = 0;
    m_boundingBox = QRect(m_xCoord, m_yCoord, 55, 95);
    m_spriteFlipped = false;
}

void Player::goLeft() {
    if (not m_goingLeft) {
        m_goingLeft = true;
        goingChangingNotified = false;
    }
}

void Player::stopLeft() {
    m_goingLeft = false;
    goingChangingNotified = false;
}

void Player::goRight() {
    if (not m_goingRight) {
        m_goingRight = true;
        goingChangingNotified = false;
    }
}

void Player::stopRight() {
    m_goingRight = false;
    goingChangingNotified = false;
}

void Player::jump() {
    m_jumping = true;
}

void Player::stopJump() {
    m_jumping = false;
}

void Player::attack() {
    if (m_reload == 0) {
        m_reload = 25;
    }
}

bool Player::update() {
    setHealth((health() + 1) % 101);
    setMana(((mana() - 1) % 101 + 101) % 101);
    if (not goingChangingNotified) {
        emit goingChanged();
        goingChangingNotified = true;
    }
    if (m_goingLeft != m_goingRight) {
        if (m_goingLeft) {
            if (m_spriteFlipped)
                flipSprite();
            moveHorizontal(-5);
        }
        if (m_goingRight) {
            if (not m_spriteFlipped)
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

    m_item->setX(m_xCoord);
    m_item->setY(m_yCoord);
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
    setX(m_xCoord + dx);
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
    setY(m_yCoord + dy);
    m_boundingBox.translate(0, dy);
}
