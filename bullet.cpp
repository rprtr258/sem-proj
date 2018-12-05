#include <QRect>
#include "bullet.h"
#include <QtMath>

Bullet::Bullet(QQuickItem *item, QVector2D direction, Map *map) : m_item(item), m_map(map) {
    m_direction = direction.normalized() * 10;
    m_position = QVector2D(m_item->position());
}

Bullet::~Bullet() {
    m_item->deleteLater();
}

bool Bullet::update() {
    if (m_died) {
        m_ttl--;
        return (m_ttl == 0);
    }
    m_position += m_direction;
    m_item->setPosition(m_position.toPoint());
    m_item->setProperty("dir", qRadiansToDegrees(M_PI + atan2(m_direction.y(), m_direction.x())));

    QRect m_boundingBox = QRect(m_position.toPoint().x(), m_position.toPoint().y(), 1, 1);
    if (m_position.x() < 0 or m_position.x() > 640 or
        m_position.y() < 0 or m_position.y() > 480 or
        m_map->isFilled(m_boundingBox)) {
        m_died = true;
    }
    return false;
}
