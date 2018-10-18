#ifndef RECTANGLE_H
#define RECTANGLE_H

#include <QtMath>

class MyRectangle {
    public:
        MyRectangle();
        MyRectangle(const qint32&, const qint32&, const qint32&, const qint32&);

        void moveHorizontal(const qint32&);
        void moveVertical(const qint32&);

    public:
        qint32 m_left;
        qint32 m_right;
        qint32 m_top;
        qint32 m_bottom;
};

#endif // RECTANGLE_H
