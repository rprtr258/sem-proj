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
}

bool doesIntersectWall(const Map &map, const Rectangle &rect) {
    return map.isFilled(rect);
}

void Player::goLeft() {
    qint32 dx = -5;
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
}

void Player::goRight() {
    qint32 dx = 5;
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

void Player::update() {
    qint32 dy = 10;
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
