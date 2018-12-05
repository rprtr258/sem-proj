#include <QRect>
#include "bullet.h"

Bullet::Bullet(QQuickItem *item, QVector2D direction, Map *map) : m_item(item), m_map(map) {
    m_direction = direction.normalized() * 10;
    m_position = QVector2D(m_item->position());
}

Bullet::~Bullet() {
    m_item->deleteLater();
}

bool Bullet::update() {
    m_position += m_direction;
    m_item->setPosition(m_position.toPoint());

    QRect m_boundingBox = QRect(m_position.toPoint().x(), m_position.toPoint().y(), 1, 1);
    return (m_position.x() < 0 or m_position.x() > 640 or
            m_position.y() < 0 or m_position.y() > 480 or
            m_map->isFilled(m_boundingBox));
}
