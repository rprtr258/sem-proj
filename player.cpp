#include "player.h"

Player::Player() {
    x = 170;
    circleBrush = QBrush(QColor(0xa6, 0xce, 0x39));
    circlePen = QPen(Qt::black);
    circlePen.setWidth(10);
}

void Player::goLeft() {
    x -= 5;
}

void Player::goRight() {
    x += 5;
}

void Player::draw(QPainter *painter) {
    painter->setBrush(circleBrush);
    painter->setPen(circlePen);
    painter->drawEllipse(QRectF(x, 0, 100, 100));
}
