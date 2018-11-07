#include "bullet.h"
#include <QRect>

Bullet::Bullet(QQuickItem *item, QVector2D direction, Map &worldMap) : m_item(item) {
    m_direction = direction / direction.length() * 10;
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
    m_map = &worldMap;
}

Bullet::~Bullet() {
    m_item->deleteLater();
    delete m_item;
}

bool Bullet::update() {
    m_position += m_direction;
    m_item->setPosition(m_position.toPointF());

    QRect m_boundingBox = QRect((qint32)m_position.x(), (qint32)m_position.y(), 1, 1);
    return (not (m_position.x() >= 0 and m_position.x() < 640 and
                m_position.y() >= 0 and m_position.y() < 480)) or
                (m_map->isFilled(m_boundingBox));
}

qint32 Bullet::getDamage() {
    return damage;
}

qint32 Bullet::getMana() {
    return mana;
}
