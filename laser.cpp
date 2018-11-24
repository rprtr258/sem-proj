#include "laser.h"

Laser::Laser(QQuickItem *item, QVector2D direction) : m_item(item) {
    m_direction = direction;
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
    m_lifetime = 20;
}

Laser::~Laser() {
    m_item->deleteLater();
}

bool Laser::update() {
    m_lifetime--;
    if (m_lifetime == 0)
        return true;
    return false;//(m_lifetime == 0);
}

qint32 Laser::getDamage() {
    return damage;
}

qint32 Laser::getMana() {
    return mana;
}
