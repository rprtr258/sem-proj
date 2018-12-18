#include "laser.h"

Laser::Laser(QQuickItem *item, QVector2D direction, qint32 damage, qint32 ownerId) : Projectile(item, nullptr, damage, ownerId), m_direction(direction) {
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
    m_lifetime = 20;
}

Laser::~Laser() {
    m_item->deleteLater();
}

bool Laser::update() {
    m_lifetime--;
    return (m_lifetime == 0);
}
