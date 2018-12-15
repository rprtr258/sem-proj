#include <QRandomGenerator>

#include "bot.h"

bool isInPlayerBoundingBox(QPoint playerCoord, QVector2D point) {
    return point.x() >= playerCoord.x() && point.x() <= playerCoord.x() + 55 &&
           point.y() >= playerCoord.y() && point.y() <= playerCoord.y() + 95;
}

Bot::Bot(Map *map, Observer *view, QQuickItem *item, QPoint pos) : Character (map, view, item, pos) {}

void Bot::goLeft() {
    stopRight();
    Character::goLeft();
}

void Bot::goRight() {
    stopLeft();
    Character::goRight();
}

bool Bot::update() {
    QRandomGenerator qrg = qrg.securelySeeded();
    switch (state) {
        case Attack: {
            qDebug() << "Attack";
            if (canAttack()) { // attack player if can
                if (qrg.generate() % 10 > 7) {
                    attack(m_map->getMarkedPoint("player").x() + 27, m_map->getMarkedPoint("player").y() + 40);
                    state = WaitReload;
                } else {
                    if (m_map->getMarkedPoint("player").x() <= m_coord.x()) {
                        goLeft();
                    } else {
                        goRight();
                    }
                }
            } else if (m_mana < m_weapon->getManaCost()) {
                state = Flee;
            } else if (isHeroVisible()) {
                // chase player
                if (m_map->getMarkedPoint("player").x() <= m_coord.x()) {
                    goLeft();
                } else {
                    goRight();
                }
            } else {
                state = Walk;
            }
            break;
        }

        case Flee: {
            qDebug() << "Flee";
            if (m_mana >= 3 * m_weapon->getManaCost()) {
                state = Attack;
            } else {
                if (m_map->getMarkedPoint("player").x() >= m_coord.x()) {
                    goLeft();
                } else {
                    goRight();
                }
                if (m_goingLeft && m_map->isFilled(m_boundingBox.translated(-5, 0))) {
                    state = Stand;
                }
                if (m_goingRight && m_map->isFilled(m_boundingBox.translated(5, 0))) {
                    state = Stand;
                }
            }
            break;
        }

        case Walk: {
            qDebug() << "Walk" << canAttack();
            if (not m_goingRight and qrg.generate() % 2)
                goLeft();
            else if (not m_goingLeft)
                goRight();
            if (canAttack()) {
                state = Attack;
            } else {
                if (m_map->isFilled(m_boundingBox.translated(-5, 0))) {
                    goRight();
                } else if (m_map->isFilled(m_boundingBox.translated(5, 0))) {
                    goLeft();
                } else if (qrg.generate() % 70 == 0){
                    if (m_goingLeft) {
                        goRight();
                    } else if (m_goingRight) {
                        goLeft();
                    }
                }
            }
            break;
        }

        case Stand: {
            qDebug() << "Stand";
            stopLeft();
            stopRight();
            if (m_mana >= 2 * m_weapon->getManaCost()) {
                if (canAttack())
                    state = Attack;
                else
                    state = Walk;
            }
            break;
        }

        case WaitReload: {
            qDebug() << "WaitReload";
            stopLeft();
            stopRight();
            if (m_reload == 0) {
                if (canAttack())
                    state = Attack;
                else if (m_mana < m_weapon->getManaCost())
                    state = Flee;
                else
                    state = Walk;
            }
            break;
        }
    }
    return Character::update();
}

bool Bot::isHeroVisible() {
    QVector2D playerCoord = QVector2D(m_map->getMarkedPoint("player")) + QVector2D(27, 47);
    QVector2D position = QVector2D(getHandPosition());
    QVector2D direction = (playerCoord - position).normalized();

    while (not m_map->isFilled(position.toPoint())) {
        position += direction;
        if (isInPlayerBoundingBox(m_map->getMarkedPoint("player"), position)) {
            return true;
        }
    }
    return false;
}

bool Bot::canAttack() {
    return isHeroVisible() && (m_mana >= m_weapon->getManaCost()) && (m_reload == 0);
}
