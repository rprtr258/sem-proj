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
    if (spriteFlipped)
        flipSprite();
    isKeyPressed[Qt::Key_A] = true;
}

void Player::stopLeft() {
    isKeyPressed[Qt::Key_A] = false;
}

void Player::goRight() {
    if (not spriteFlipped)
        flipSprite();
    isKeyPressed[Qt::Key_D] = true;
}

void Player::stopRight() {
    isKeyPressed[Qt::Key_D] = false;
}

void Player::update() {
    if (isKeyPressed[Qt::Key_A]) {
        int dx = -5;
        Rectangle newRect = boundingBox;
        newRect.moveHorizontal(dx);
        while (doesIntersectWall(*map, newRect) and dx < 0) {
            dx++;
            newRect.moveHorizontal(1);
        }
        if (dx == 0)
            return;
        x += dx;
        boundingBox.moveHorizontal(dx);
    } else if (isKeyPressed[Qt::Key_D]) {
        int dx = 5;
        Rectangle newRect = boundingBox;
        newRect.moveHorizontal(dx);
        while (doesIntersectWall(*map, newRect) and dx > 0) {
            dx--;
            newRect.moveHorizontal(-1);
        }
        if (dx == 0)
            return;
        x += dx;
        boundingBox.moveHorizontal(dx);
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
