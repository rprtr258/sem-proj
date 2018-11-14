#include "bullet.h"

Bullet::Bullet(QQuickItem *item, QVector2D direction) : m_item(item) {
    m_direction = direction / direction.length() * 10;
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
}

Bullet::~Bullet() {
    m_item->deleteLater();
    delete m_item;
}

bool Bullet::update() {
    m_position += m_direction;
    m_item->setPosition(m_position.toPointF());
    return not (m_position.x() >= -100 and m_position.x() <= 740 and
                m_position.y() >= -100 and m_position.y() <= 580);
}
