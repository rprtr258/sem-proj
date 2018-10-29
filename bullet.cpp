#include "bullet.h"

Bullet::Bullet(QQuickItem *item) : m_item(item) {
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
    m_direction.setX(10);
}

Bullet::~Bullet() {
    m_item->deleteLater();
    delete m_item;
}

bool Bullet::update() {
    m_position += m_direction;
    m_item->setPosition(m_position.toPointF());
    return not (m_position.x() >= 0 or m_position.x() < 640 or
                m_position.y() >= 0 or m_position.y() < 480);
}
