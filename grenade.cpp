#include <QRect>
#include <QtMath>
#include "grenade.h"

Grenade::Grenade(QQuickItem *item, QVector2D mouseCoord, QVector2D playerCoord, Map &worldMap) : m_item(item) {
    m_position.setX(m_item->property("x").toInt());
    m_position.setY(m_item->property("y").toInt());
    m_map = &worldMap;
    m_mouseCoord = mouseCoord;
    m_playerCoord = playerCoord;
}

Grenade::~Grenade() {
    m_item->deleteLater();
    delete m_item;
}

float parabolaValue(float x, float a, float b, float c) {
    return x * x * a + b * x + c;
}

int t = 0;

//a * x^2 + b * x + c = y(x)
bool Grenade::update() {
    if (m_playerCoord.y() == m_mouseCoord.y() && m_playerCoord.x() == m_mouseCoord.x()) {
        return false;
    }

    // x0 == x1 !!!

    float dx = m_playerCoord.x() - m_mouseCoord.x(); // x1 - x0
    float dy = m_playerCoord.y() - m_mouseCoord.y(); // y1 - y0
    float a = 0.0;
    float b = 0.0;
    float c = 0.0;
    float coefficient = 0.0;

    if (dy > 0) {
        if (dx == 0) {
            m_position.setY(m_position.y() - t * 5 + t * t * 1);
            t += 1;
        } else {
            a = dy / (dx * dx);
            b = (-2*dy * m_mouseCoord.x()) / (dx * dx);
            c = m_mouseCoord.y() - a * m_mouseCoord.x() * m_mouseCoord.x() - b * m_mouseCoord.x();
            coefficient = 1 / sqrt(1 + pow((2 * a * m_playerCoord.x() + b), 2));
        }
    } else {
        if (dx == 0) {

        }
        a = -dy / (dx * dx);
        b = (2*dy * m_playerCoord.x()) / (dx * dx);
        c = m_mouseCoord.y() - a * m_mouseCoord.x() * m_mouseCoord.x() - b * m_mouseCoord.x();
        coefficient = 1 / sqrt(1 + pow((2 * a * m_mouseCoord.x() + b), 2));
    }

    if (dx != 0) {
        m_position.setX(m_position.x() - 10 * coefficient * dx / abs(dx));
        m_position.setY(parabolaValue(m_position.x(), a, b, c));
    }

    m_item->setPosition(m_position.toPointF());

    QRect m_boundingBox = QRect((qint32)m_position.x(), (qint32)m_position.y(), 1, 1);
    return (not (m_position.x() >= 0 and m_position.x() < 640 and
                (m_position.y() >=0 and m_position.y() < 480))) or
                (m_map->isFilled(m_boundingBox));
}

qint32 Grenade::getDamage() {
    return damage;
}

qint32 Grenade::getMana() {
    return mana;
}

