#include "player.h"

int sign(const int &x) {
    return (x > 0) - (x < 0);
}

Player::Player(Map &worldMap) {
    goingLeft = goingRight = false;
    jumping = false;
    vspeed = 0;
    x = 170;
    y = 0;
    map = &worldMap;
    boundingBox.left = x;
    boundingBox.right = x + 55;
    boundingBox.top = y;
    boundingBox.bottom = y + 95;
    spriteFlipped = false;
}

void Player::goLeft() {
    goingLeft = true;
    if (spriteFlipped)
        flipSprite();
}

void Player::stopLeft() {
    goingLeft = false;
}

void Player::goRight() {
    goingRight = true;
    if (not spriteFlipped)
        flipSprite();
}

void Player::stopRight() {
    goingRight = false;
}

void Player::jump() {
    jumping = true;
}

void Player::stopJump() {
    jumping = false;
}

void Player::update() {
    if (goingLeft)
        moveHorizontal(-5);
    if (goingRight)
        moveHorizontal(5);
    if (jumping and map->isFilled(boundingBox.left, boundingBox.bottom + 1))
        vspeed = 30;
    moveVertical(10 - vspeed);
    vspeed = std::max(vspeed - 1, 0);
}

void Player::flipSprite() {
    spriteFlipped = not spriteFlipped;
    //sprite = sprite.transformed(QMatrix(-1, 0, 0, 1, 0, 0));
}

void Player::moveHorizontal(int speed) {
    int dx = speed;
    int delta = sign(speed);
    MyRectangle newRect = boundingBox;
    newRect.moveHorizontal(dx);
    while (map->isFilled(newRect) and dx * delta > 0) {
        dx -= delta;
        newRect.moveHorizontal(-delta);
    }
    if (dx == 0)
        return;
    setX(x + dx);
    boundingBox.moveHorizontal(dx);
}

void Player::moveVertical(int speed) {
    int dy = speed;
    int delta = sign(speed);
    MyRectangle newRect = boundingBox;
    newRect.moveVertical(dy);
    while (map->isFilled(newRect) and dy * delta > 0) {
        dy -= delta;
        newRect.moveVertical(-delta);
        vspeed = 0;
    }
    if (dy == 0)
        return;
    setY(y + dy);
    boundingBox.moveVertical(dy);
}
