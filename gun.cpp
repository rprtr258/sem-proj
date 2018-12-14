#include "gun.h"

Bullet* Gun::shoot(Observer *view, QVector2D mouseCoord, QVector2D playerCoord, Map *map) {
    QQuickItem *bulletItem = view->createBullet(playerCoord.toPoint().x(), playerCoord.toPoint().y());
    Bullet *bullet = new Bullet(bulletItem, mouseCoord - playerCoord, map);
    view->addCreature(bullet);
    return bullet;
}
