#ifndef MAP_H
#define MAP_H

#include <QRect>
#include <QVector>

class Map {
    public:
        bool isFilled(const qint32 &x, const qint32 &y) const;
        bool isFilled(const QPoint &p) const;
        bool isFilled(const QRect &r) const;
        void fillRectangle(qint32 x1, qint32 y1, qint32 width, qint32 height);
    private:
        QVector<QRect> m_rects;
};

#endif // MAP_H
