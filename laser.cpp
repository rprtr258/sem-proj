#include "laser.h"

Laser::Laser(QQuickItem *item, QVector2D direction) : m_item(item) {
    m_direction = direction / direction.length() * 10;
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
}

Laser::~Laser() {
    m_item->deleteLater();
    delete m_item;
}

bool Laser::update() {
    return not (m_position.x() >= 0 and m_position.x() < 640 and
                m_position.y() >= 0 and m_position.y() < 480);
}

qint32 Laser::getDamage() {
    return damage;
}

qint32 Laser::getMana() {
    return mana;
}
