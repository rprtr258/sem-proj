#include "player.h"
#include <QVariant>

qint32 sign(const qint32 &x) {
    return (x > 0) - (x < 0);
}

Player::Player(Map &worldMap) {
    m_goingLeft = m_goingRight = false;
    m_jumping = false;
    m_vspeed = 0;
    m_xCoord = 170;
    m_yCoord = 0;
    m_map = &worldMap;
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

void Player::update() {
    if (not goingChangingNotified) {
        emit goingChanged();
        goingChangingNotified = true;
    }
    if (m_goingLeft != m_goingRight) {
        if (m_goingLeft) {
            if (flipped())
                flipSprite();
            moveHorizontal(-5);
        }
        if (m_goingRight) {
            if (not flipped())
                flipSprite();
            moveHorizontal(5);
        }
    }
    if (m_jumping and m_map->isFilled(m_boundingBox.translated(0, 1))) {
        setInAir(true);
        m_vspeed = 30;
    } else if (!m_jumping and m_map->isFilled(m_boundingBox.translated(0, 1))) {
        setInAir(false);
    }
    moveVertical(10 - m_vspeed);
    m_vspeed = std::max(m_vspeed - 1, 0);
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
    if (not inAir())
        setInAir(true);
    setY(m_yCoord + dy);
    m_boundingBox.translate(0, dy);
}
