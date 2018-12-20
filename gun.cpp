#include "gun.h"

void Gun::shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map, qint32 ownerId) {
    QQuickItem *bulletItem = view->createBullet(playerCoord.toPoint().x(), playerCoord.toPoint().y());
    Bullet *bullet = new Bullet(bulletItem, mouseCoord - playerCoord, map, 30, ownerId);
    view->addCreature(bullet);
}
