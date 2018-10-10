#include "player.h"
#include <QBitmap>

Player::Player(Map &worldMap) {
    goingLeft = goingRight = false;
    x = 170;
    y = 0;
    map = &worldMap;
    boundingBox.left = x;
    boundingBox.right = x + 55;
    boundingBox.top = y;
    boundingBox.bottom = y + 95;
    sprite.load(":/img/hero.png");
    sprite.setMask(sprite.createHeuristicMask());
    spriteFlipped = false;
}

bool doesIntersectWall(const Map &map, const Rectangle &rect) {
    return map.isFilled(rect);
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

void Player::update() {
    if (goingLeft)
        moveHorizontal(-5);
    if (goingRight)
        moveHorizontal(5);
    int dy = 10;
    Rectangle newRect = boundingBox;
    newRect.moveVertical(dy);
    while (doesIntersectWall(*map, newRect) and dy > 0) {
        dy--;
        newRect.moveVertical(-1);
    }
    if (dy == 0)
        return;
    y += dy;
    boundingBox.moveVertical(dy);
}

void Player::draw(QPainter *painter) {
    painter->drawPixmap(x, y, sprite.copy(0, 28, 55, 95));
}

void Player::flipSprite() {
    spriteFlipped = not spriteFlipped;
    sprite = sprite.transformed(QMatrix(-1, 0, 0, 1, 0, 0));
}

int sign(const int &x) {
    return (x > 0) - (x < 0);
}

void Player::moveHorizontal(int speed) {
    int dx = speed;
    int delta = sign(speed);
    Rectangle newRect = boundingBox;
    newRect.moveHorizontal(dx);
    while (doesIntersectWall(*map, newRect) and dx * delta > 0) {
        dx -= delta;
        newRect.moveHorizontal(1);
    }
    if (dx == 0)
        return;
    x += dx;
    boundingBox.moveHorizontal(dx);
}
