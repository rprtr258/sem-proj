#include "player.h"
#include <QtMath>

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
    m_boundingBox.m_left = m_xCoord;
    m_boundingBox.m_right = m_xCoord + 55;
    m_boundingBox.m_top = m_yCoord;
    m_boundingBox.m_bottom = m_yCoord + 95;
    m_spriteFlipped = false;
}

void Player::goLeft() {
    m_goingLeft = true;
    if (m_spriteFlipped)
        flipSprite();
}

void Player::stopLeft() {
    m_goingLeft = false;
}

void Player::goRight() {
    m_goingRight = true;
    if (not m_spriteFlipped)
        flipSprite();
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

void Player::update() {
    if (m_goingLeft)
        moveHorizontal(-5);
    if (m_goingRight)
        moveHorizontal(5);
    if (m_jumping and m_map->isFilled(m_boundingBox.m_left, m_boundingBox.m_bottom + 1))
        m_vspeed = 30;
    moveVertical(10 - m_vspeed);
    m_vspeed = std::max(m_vspeed - 1, 0);
}

void Player::flipSprite() {
    m_spriteFlipped = not m_spriteFlipped;
    //sprite = sprite.transformed(QMatrix(-1, 0, 0, 1, 0, 0));
}

void Player::moveHorizontal(qint32 speed) {
    qint32 dx = speed;
    qint32 delta = sign(speed);
    MyRectangle newRect = m_boundingBox;
    newRect.moveHorizontal(dx);
    while (m_map->isFilled(newRect) and dx * delta > 0) {
        dx -= delta;
        newRect.moveHorizontal(-delta);
    }
    if (dx == 0)
        return;
    setX(m_xCoord + dx);
    m_boundingBox.moveHorizontal(dx);
}

void Player::moveVertical(qint32 speed) {
    qint32 dy = speed;
    qint32 delta = sign(speed);
    MyRectangle newRect = m_boundingBox;
    newRect.moveVertical(dy);
    while (m_map->isFilled(newRect) and dy * delta > 0) {
        dy -= delta;
        newRect.moveVertical(-delta);
        m_vspeed = 0;
    }
    if (dy == 0)
        return;
    setY(m_yCoord + dy);
    m_boundingBox.moveVertical(dy);
}
