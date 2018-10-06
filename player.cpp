#include "player.h"
#include <QBitmap>

Player::Player(Map &worldMap) {
    x = 170;
    map = &worldMap;
    boundingBox.left = x;
    boundingBox.right = x + 55;
    boundingBox.top = 0;
    boundingBox.bottom = 95;
    sprite.load("C:\\Users\\rprtr258\\projects\\prototype\\img\\hero.png");
    sprite.setMask(sprite.createHeuristicMask());
}

Rectangle getDeltaRect(const Rectangle &rect, const int &dx) {
    Rectangle res = rect;
    res.moveHorizontal(dx);
    return res;
}

bool doesIntersectWall(const Map &map, const Rectangle &rect) {
    return map.isFilled(rect);
}

void Player::goLeft() {
    int dx = -5;
    Rectangle newRect = getDeltaRect(boundingBox, dx);
    while (doesIntersectWall(*map, newRect) and dx < 0) {
        dx++;
        newRect = getDeltaRect(boundingBox, dx);
    }
    if (doesIntersectWall(*map, newRect) or dx == 0)
        return;
    x += dx;
    boundingBox.moveHorizontal(dx);
}

void Player::goRight() {
    int dx = 5;
    Rectangle newRect = getDeltaRect(boundingBox, dx);
    while (doesIntersectWall(*map, newRect) and dx > 0) {
        dx--;
        newRect = getDeltaRect(boundingBox, dx);
    }
    if (doesIntersectWall(*map, newRect) or dx == 0)
        return;
    x += dx;
    boundingBox.moveHorizontal(dx);
}

void Player::draw(QPainter *painter) {
    painter->drawPixmap(x, 0, sprite.copy(0, 28, 55, 95));
}
