#include "player.h"
#include <QBitmap>

Player::Player(Map &worldMap) {
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
    if (not isKeyPressed[Qt::Key_A] and not isKeyPressed[Qt::Key_D]) {
        if (spriteFlipped)
            flipSprite();
        isKeyPressed[Qt::Key_A] = true;
    }
}

void Player::stopLeft() {
    isKeyPressed[Qt::Key_A] = false;
}

void Player::goRight() {
    if (not isKeyPressed[Qt::Key_A] and not isKeyPressed[Qt::Key_D]) {
        if (not spriteFlipped)
            flipSprite();
        isKeyPressed[Qt::Key_D] = true;
    }
}

void Player::stopRight() {
    isKeyPressed[Qt::Key_D] = false;
}

void Player::update() {
    if (isKeyPressed[Qt::Key_A]) {
        moveHorizontal(-5);
    }
    if (isKeyPressed[Qt::Key_D]) {
        moveHorizontal(5);
    }
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
