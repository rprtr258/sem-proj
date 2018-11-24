#include <QRect>
#include "bullet.h"

Bullet::Bullet(QQuickItem *item, QVector2D direction, Map *worldMap) : m_item(item) {
    m_direction = direction / direction.length() * 10;
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
    m_map = worldMap;
}

Bullet::~Bullet() {
    m_item->deleteLater();
}

bool Bullet::update() {
    m_position += m_direction;
    m_item->setPosition(m_position.toPointF());

    QRect m_boundingBox = QRect(m_position.toPoint().x(), m_position.toPoint().y(), 1, 1);
    return (m_position.x() < 0 or m_position.x() > 640 or
            m_position.y() < 0 or m_position.y() > 480 or
            m_map->isFilled(m_boundingBox));
}
